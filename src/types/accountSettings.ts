export interface GmailSettings {
  senderEmail: string
  appPassword: string
}

export interface MessageTemplate {
  title: string
  content: string
  subject?: string
}

export interface GmailSenderCard extends GmailSettings {
  id: string
  templates: MessageTemplate[]
}

export interface WhatsAppSettings {
  phoneNumber: string
  accessToken: string
  phoneNumberId: string
  businessId: string
  templates: string[]
}

export interface WhatsAppSenderCard extends WhatsAppSettings {
  id: string
  templates: MessageTemplate[]
}

export interface AccountSettings {
  gmail: GmailSettings
  gmailSenders: GmailSenderCard[]
  whatsapp: WhatsAppSettings
  whatsappSenders: WhatsAppSenderCard[]
}

export const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  gmail: {
    senderEmail: '',
    appPassword: ''
  },
  gmailSenders: [],
  whatsapp: {
    phoneNumber: '',
    accessToken: '',
    phoneNumberId: '',
    businessId: '',
    templates: []
  },
  whatsappSenders: []
}
