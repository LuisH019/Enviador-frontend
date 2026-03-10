import { config } from '../config'
import { AccountSettings, GmailSettings, WhatsAppSettings } from '../types/accountSettings'
import { loadAccountSettings, saveAccountSettings } from '../utils/accountSettingsStorage'

const API_BASE = config.API_BASE

type AccountSettingsApiResponse = {
  gmailSenders?: AccountSettings['gmailSenders']
  whatsappSenders?: AccountSettings['whatsappSenders']
  activeGmailSenderId?: string
  activeWhatsappSenderId?: string
}

function toAccountSettings(data: AccountSettingsApiResponse, base?: AccountSettings): AccountSettings {
  const current = base || loadAccountSettings()

  return saveAccountSettings({
    gmailSenders: data.gmailSenders ?? current.gmailSenders,
    whatsappSenders: data.whatsappSenders ?? current.whatsappSenders,
    activeGmailSenderId: data.activeGmailSenderId ?? current.activeGmailSenderId,
    activeWhatsappSenderId: data.activeWhatsappSenderId ?? current.activeWhatsappSenderId
  })
}

function toApiPayload(settings: AccountSettings): AccountSettingsApiResponse {
  return {
    gmailSenders: settings.gmailSenders,
    whatsappSenders: settings.whatsappSenders,
    activeGmailSenderId: settings.activeGmailSenderId,
    activeWhatsappSenderId: settings.activeWhatsappSenderId
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const json = await response.json()
    if (typeof json?.detail === 'string') return json.detail
    if (typeof json?.message === 'string') return json.message
    return JSON.stringify(json)
  } catch {
    return `Status ${response.status}`
  }
}

export const accountSettingsService = {
  async getSettings(token: string): Promise<AccountSettings> {
    const response = await fetch(`${API_BASE}/account/settings/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    const data = (await response.json()) as AccountSettingsApiResponse
    return toAccountSettings(data)
  },

  async saveSettings(token: string, settings: AccountSettings): Promise<AccountSettings> {
    const response = await fetch(`${API_BASE}/account/settings/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`
      },
      body: JSON.stringify(toApiPayload(settings))
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    const data = (await response.json()) as AccountSettingsApiResponse
    return toAccountSettings(data)
  },

  async saveGmailSettings(token: string, gmail: GmailSettings): Promise<AccountSettings> {
    const current = loadAccountSettings()
    const existingIndex = current.gmailSenders.findIndex(sender => sender.senderEmail === gmail.senderEmail)
    const gmailSenders = [...current.gmailSenders]

    if (existingIndex >= 0) {
      gmailSenders[existingIndex] = { ...gmailSenders[existingIndex], ...gmail }
    } else {
      gmailSenders.unshift({
        id: crypto.randomUUID(),
        senderEmail: gmail.senderEmail,
        appPassword: gmail.appPassword,
        templates: []
      })
    }

    const next = saveAccountSettings({
      ...current,
      gmailSenders,
      activeGmailSenderId: gmailSenders.find(sender => sender.senderEmail === gmail.senderEmail)?.id || current.activeGmailSenderId
    })

    return this.saveSettings(token, next)
  },

  async saveWhatsAppSettings(token: string, whatsapp: WhatsAppSettings): Promise<AccountSettings> {
    const current = loadAccountSettings()
    const existingIndex = current.whatsappSenders.findIndex(sender =>
      sender.phoneNumber === whatsapp.phoneNumber &&
      sender.phoneNumberId === whatsapp.phoneNumberId &&
      sender.businessId === whatsapp.businessId
    )
    const whatsappSenders = [...current.whatsappSenders]

    if (existingIndex >= 0) {
      whatsappSenders[existingIndex] = {
        ...whatsappSenders[existingIndex],
        ...whatsapp,
        templates: whatsappSenders[existingIndex].templates
      }
    } else {
      whatsappSenders.unshift({
        id: crypto.randomUUID(),
        ...whatsapp,
        templates: whatsapp.templates.map(title => ({ title, content: '' }))
      })
    }

    const activeSender = whatsappSenders.find(sender =>
      sender.phoneNumber === whatsapp.phoneNumber &&
      sender.phoneNumberId === whatsapp.phoneNumberId &&
      sender.businessId === whatsapp.businessId
    )

    const next = saveAccountSettings({
      ...current,
      whatsappSenders,
      activeWhatsappSenderId: activeSender?.id || current.activeWhatsappSenderId
    })

    return this.saveSettings(token, next)
  },

  getCachedSettings(): AccountSettings {
    return loadAccountSettings()
  }
}
