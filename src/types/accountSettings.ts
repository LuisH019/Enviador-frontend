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
  gmailSenders: GmailSenderCard[]
  whatsappSenders: WhatsAppSenderCard[]
  activeGmailSenderId: string
  activeWhatsappSenderId: string
}

export const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  gmailSenders: [],
  whatsappSenders: [],
  activeGmailSenderId: '',
  activeWhatsappSenderId: ''
}
