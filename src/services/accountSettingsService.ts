import { config } from '../config'
import { AccountSettings, GmailSettings, WhatsAppSettings } from '../types/accountSettings'
import { loadAccountSettings, saveAccountSettings } from '../utils/accountSettingsStorage'

const API_BASE = config.API_BASE

type AccountSettingsApiResponse = {
  gmail_sender_email?: string
  gmail_app_password?: string
  whatsapp_phone_number?: string
  whatsapp_access_token?: string
  whatsapp_phone_number_id?: string
  whatsapp_business_id?: string
  whatsapp_templates?: string[]
  gmail?: {
    senderEmail?: string
    appPassword?: string
  }
  whatsapp?: {
    phoneNumber?: string
    accessToken?: string
    phoneNumberId?: string
    businessId?: string
    templates?: string[]
  }
}

function toAccountSettings(data: AccountSettingsApiResponse, base?: AccountSettings): AccountSettings {
  const camelGmail = data.gmail || {}
  const camelWhatsapp = data.whatsapp || {}
  const current = base || loadAccountSettings()

  const nextGmailEmail = (data.gmail_sender_email ?? camelGmail.senderEmail ?? current.gmail.senderEmail).trim()
  const existingGmailSender = current.gmailSenders.find(sender => sender.senderEmail === nextGmailEmail)

  const nextGmail: GmailSettings = {
    senderEmail: nextGmailEmail,
    appPassword:
      data.gmail_app_password ??
      camelGmail.appPassword ??
      existingGmailSender?.appPassword ??
      (current.gmail.senderEmail === nextGmailEmail ? current.gmail.appPassword : '')
  }

  const currentGmailSenders = current.gmailSenders || []
  const gmailActiveIndex = currentGmailSenders.findIndex(sender => sender.senderEmail === nextGmail.senderEmail)
  const gmailSenders = [...currentGmailSenders]
  if (gmailActiveIndex >= 0) {
    gmailSenders[gmailActiveIndex] = { ...gmailSenders[gmailActiveIndex], ...nextGmail }
  } else if (nextGmail.senderEmail && nextGmail.appPassword) {
    gmailSenders.unshift({
      id: `active-gmail-${nextGmail.senderEmail || Date.now()}`,
      ...nextGmail,
      templates: []
    })
  }

  const nextWhatsapp: WhatsAppSettings = {
    phoneNumber: (data.whatsapp_phone_number ?? camelWhatsapp.phoneNumber ?? current.whatsapp.phoneNumber).trim(),
    accessToken: (data.whatsapp_access_token ?? camelWhatsapp.accessToken ?? current.whatsapp.accessToken).trim(),
    phoneNumberId: (data.whatsapp_phone_number_id ?? camelWhatsapp.phoneNumberId ?? current.whatsapp.phoneNumberId).trim(),
    businessId: (data.whatsapp_business_id ?? camelWhatsapp.businessId ?? current.whatsapp.businessId).trim(),
    templates: Array.from(new Set((data.whatsapp_templates ?? camelWhatsapp.templates ?? current.whatsapp.templates).map(item => item.trim()).filter(Boolean)))
  }

  const nextSenders = current.whatsappSenders || []
  const activeIndex = nextSenders.findIndex(sender =>
    sender.phoneNumber === nextWhatsapp.phoneNumber &&
    sender.phoneNumberId === nextWhatsapp.phoneNumberId &&
    sender.businessId === nextWhatsapp.businessId
  )

  const whatsappSenders = [...nextSenders]
  if (activeIndex >= 0) {
    whatsappSenders[activeIndex] = {
      ...whatsappSenders[activeIndex],
      ...nextWhatsapp,
      templates: whatsappSenders[activeIndex].templates || []
    }
  } else if (nextWhatsapp.phoneNumber || nextWhatsapp.accessToken || nextWhatsapp.phoneNumberId || nextWhatsapp.businessId) {
    whatsappSenders.unshift({
      id: `active-${nextWhatsapp.phoneNumberId || nextWhatsapp.phoneNumber || Date.now()}`,
      ...nextWhatsapp,
      templates: nextWhatsapp.templates.map(title => ({ title, content: '' }))
    })
  }

  return {
    gmail: nextGmail,
    gmailSenders,
    whatsapp: nextWhatsapp,
    whatsappSenders
  }
}

function toApiPayload(settings: AccountSettings): AccountSettingsApiResponse {
  return {
    gmail_sender_email: settings.gmail.senderEmail,
    gmail_app_password: settings.gmail.appPassword,
    whatsapp_phone_number: settings.whatsapp.phoneNumber,
    whatsapp_access_token: settings.whatsapp.accessToken,
    whatsapp_phone_number_id: settings.whatsapp.phoneNumberId,
    whatsapp_business_id: settings.whatsapp.businessId,
    whatsapp_templates: settings.whatsapp.templates
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
    return saveAccountSettings(toAccountSettings(data))
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
    return saveAccountSettings(toAccountSettings(data))
  },

  async saveGmailSettings(token: string, gmail: GmailSettings): Promise<AccountSettings> {
    const response = await fetch(`${API_BASE}/account/settings/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`
      },
      body: JSON.stringify({
        gmail_sender_email: gmail.senderEmail,
        gmail_app_password: gmail.appPassword
      })
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    const data = (await response.json()) as AccountSettingsApiResponse
    const current = loadAccountSettings()
    return saveAccountSettings(toAccountSettings(data, { ...current, gmail }))
  },

  async saveWhatsAppSettings(token: string, whatsapp: WhatsAppSettings): Promise<AccountSettings> {
    const response = await fetch(`${API_BASE}/account/settings/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`
      },
      body: JSON.stringify({
        whatsapp_phone_number: whatsapp.phoneNumber,
        whatsapp_access_token: whatsapp.accessToken,
        whatsapp_phone_number_id: whatsapp.phoneNumberId,
        whatsapp_business_id: whatsapp.businessId,
        whatsapp_templates: whatsapp.templates
      })
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    const data = (await response.json()) as AccountSettingsApiResponse
    const current = loadAccountSettings()
    return saveAccountSettings(toAccountSettings(data, { ...current, whatsapp }))
  },

  getCachedSettings(): AccountSettings {
    return loadAccountSettings()
  }
}
