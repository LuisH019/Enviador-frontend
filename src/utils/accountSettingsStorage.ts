import { AccountSettings, DEFAULT_ACCOUNT_SETTINGS, GmailSenderCard, MessageTemplate, WhatsAppSenderCard, WhatsAppSettings } from '../types/accountSettings'

const STORAGE_KEY = 'enviador_account_settings_v1'

function sanitizeTemplates(templates: string[]): string[] {
  const normalized = templates.map(t => t.trim()).filter(Boolean)
  return Array.from(new Set(normalized))
}

type LooseGmailSenderCard = Omit<Partial<GmailSenderCard>, 'templates'> & {
  templates?: Array<string | MessageTemplate>
}

type LooseWhatsappSenderCard = Omit<Partial<WhatsAppSenderCard>, 'templates'> & {
  templates?: Array<string | MessageTemplate>
}

function sanitizeCardTemplates(templates: Array<string | MessageTemplate> | undefined): MessageTemplate[] {
  if (!templates) return []

  const normalized = templates
    .map<MessageTemplate | null>((template) => {
      if (typeof template === 'string') {
        const title = template.trim()
        if (!title) return null
        return { title, content: '' }
      }

      const title = template.title?.trim() || ''
      const content = template.content?.trim() || ''
      const subject = template.subject?.trim() || ''
      if (!title) return null
      return subject ? { title, content, subject } : { title, content }
    })
    .filter((template): template is MessageTemplate => template !== null)

  return normalized.filter((template, index, arr) => arr.findIndex(item => item.title === template.title) === index)
}

function sanitizeGmailSenderCard(card: LooseGmailSenderCard): GmailSenderCard | null {
  const senderEmail = card.senderEmail?.trim() || ''
  const appPassword = card.appPassword || ''

  if (!senderEmail && !appPassword) return null

  return {
    id: card.id?.trim() || `${senderEmail || 'gmail'}-${Date.now()}`,
    senderEmail,
    appPassword,
    templates: sanitizeCardTemplates(card.templates)
  }
}

function sanitizeGmailSenders(cards: Array<Partial<GmailSenderCard>> | undefined, fallback: { senderEmail: string; appPassword: string }): GmailSenderCard[] {
  const source = cards && cards.length > 0 ? cards : []
  const normalized = source
    .map(sanitizeGmailSenderCard)
    .filter((card): card is GmailSenderCard => Boolean(card))

  const hasActive = normalized.some(card => card.senderEmail === fallback.senderEmail)
  if (!hasActive) {
    const active = sanitizeGmailSenderCard({
      id: `active-gmail-${fallback.senderEmail || Date.now()}`,
      senderEmail: fallback.senderEmail,
      appPassword: fallback.appPassword,
      templates: []
    })
    if (active) normalized.unshift(active)
  }

  return normalized
}

function sanitizeWhatsappSenderCard(card: LooseWhatsappSenderCard): WhatsAppSenderCard | null {
  const phoneNumber = card.phoneNumber?.trim() || ''
  const accessToken = card.accessToken?.trim() || ''
  const phoneNumberId = card.phoneNumberId?.trim() || ''
  const businessId = card.businessId?.trim() || ''
  const templates = sanitizeCardTemplates(card.templates)

  if (!phoneNumber && !accessToken && !phoneNumberId && !businessId && templates.length === 0) return null

  return {
    id: card.id?.trim() || `${phoneNumber || 'sender'}-${phoneNumberId || Date.now()}`,
    phoneNumber,
    accessToken,
    phoneNumberId,
    businessId,
    templates: sanitizeCardTemplates(card.templates)
  }
}

function sanitizeWhatsappSenders(cards: Array<Partial<WhatsAppSenderCard>> | undefined, fallback: WhatsAppSettings): WhatsAppSenderCard[] {
  const source = cards && cards.length > 0 ? cards : []
  const normalized = source
    .map(sanitizeWhatsappSenderCard)
    .filter((card): card is WhatsAppSenderCard => Boolean(card))

  const hasActive = normalized.some(card =>
    card.phoneNumber === fallback.phoneNumber &&
    card.phoneNumberId === fallback.phoneNumberId &&
    card.businessId === fallback.businessId
  )

  if (!hasActive) {
    const activeCard = sanitizeWhatsappSenderCard({
      id: `active-${fallback.phoneNumberId || fallback.phoneNumber || Date.now()}`,
      phoneNumber: fallback.phoneNumber,
      accessToken: fallback.accessToken,
      phoneNumberId: fallback.phoneNumberId,
      businessId: fallback.businessId,
      templates: fallback.templates
    })
    if (activeCard) normalized.unshift(activeCard)
  }

  return normalized
}

function normalizeSettings(input: Partial<AccountSettings> | null | undefined): AccountSettings {
  const gmail = {
    senderEmail: input?.gmail?.senderEmail?.trim() || '',
    appPassword: input?.gmail?.appPassword || ''
  }

  return {
    gmail,
    gmailSenders: sanitizeGmailSenders(input?.gmailSenders, gmail),
    whatsapp: {
      phoneNumber: input?.whatsapp?.phoneNumber?.trim() || '',
      accessToken: input?.whatsapp?.accessToken?.trim() || '',
      phoneNumberId: input?.whatsapp?.phoneNumberId?.trim() || '',
      businessId: input?.whatsapp?.businessId?.trim() || '',
      templates: sanitizeTemplates(input?.whatsapp?.templates || [])
    },
    whatsappSenders: sanitizeWhatsappSenders(input?.whatsappSenders, {
      phoneNumber: input?.whatsapp?.phoneNumber?.trim() || '',
      accessToken: input?.whatsapp?.accessToken?.trim() || '',
      phoneNumberId: input?.whatsapp?.phoneNumberId?.trim() || '',
      businessId: input?.whatsapp?.businessId?.trim() || '',
      templates: sanitizeTemplates(input?.whatsapp?.templates || [])
    })
  }
}

export function loadAccountSettings(): AccountSettings {
  if (typeof window === 'undefined') return DEFAULT_ACCOUNT_SETTINGS

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_ACCOUNT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<AccountSettings>
    return normalizeSettings(parsed)
  } catch {
    return DEFAULT_ACCOUNT_SETTINGS
  }
}

export function saveAccountSettings(settings: AccountSettings): AccountSettings {
  const normalized = normalizeSettings(settings)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }

  return normalized
}

export function getWhatsAppConfigStatus(whatsapp: WhatsAppSettings): { isConfigured: boolean; missingFields: string[] } {
  const missingFields: string[] = []

  if (!whatsapp.phoneNumber.trim()) missingFields.push('Número de telefone')
  if (!whatsapp.accessToken.trim()) missingFields.push('Token de acesso')
  if (!whatsapp.phoneNumberId.trim()) missingFields.push('Phone Number ID')
  if (!whatsapp.businessId.trim()) missingFields.push('Business ID')

  return {
    isConfigured: missingFields.length === 0,
    missingFields
  }
}
