import React from 'react'
import { GmailSenderCard, WhatsAppSenderCard } from '../../types/accountSettings'

type Props = {
  channel: 'whatsapp' | 'email' | 'none'
  theme: {
    bg: string
    border: string
  }
  gmailSenders: GmailSenderCard[]
  whatsappSenders: WhatsAppSenderCard[]
  selectedEmailSender: string
  selectedEmailTemplateTitle: string
  selectedWhatsappSenderId: string
  selectedWhatsappTemplateTitle: string
  emailTemplates: Array<{ title: string }>
  whatsappTemplates: Array<{ title: string }>
  onEmailSenderChange: (value: string) => void
  onEmailTemplateChange: (value: string) => void
  onWhatsappSenderChange: (value: string) => void
  onWhatsappTemplateChange: (value: string) => void
}

export function TemplateSelectionSection({
  channel,
  theme,
  gmailSenders,
  whatsappSenders,
  selectedEmailSender,
  selectedEmailTemplateTitle,
  selectedWhatsappSenderId,
  selectedWhatsappTemplateTitle,
  emailTemplates,
  whatsappTemplates,
  onEmailSenderChange,
  onEmailTemplateChange,
  onWhatsappSenderChange,
  onWhatsappTemplateChange
}: Props) {
  return (
    <div className={`mb-4 p-4 rounded ${theme.bg} border ${theme.border} space-y-3`}>
      <h3 className="font-medium">Template de Mensagem</h3>

      {channel === 'email' && (
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium mb-1">Remetente cadastrado</div>
            <select
              value={selectedEmailSender}
              onChange={e => onEmailSenderChange(e.target.value)}
              className="input w-full"
            >
              <option value="">Selecione um remetente cadastrado...</option>
              {gmailSenders.map(sender => (
                <option key={sender.id} value={sender.senderEmail}>{sender.senderEmail}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Template de Email</div>
            <select
              value={selectedEmailTemplateTitle}
              onChange={e => onEmailTemplateChange(e.target.value)}
              className="input w-full"
            >
              <option value="">Selecione a template...</option>
              {emailTemplates.map(template => (
                <option key={template.title} value={template.title}>{template.title}</option>
              ))}
            </select>
            <div className="text-xs text-slate-500 mt-1">
              Ao selecionar, assunto e mensagem serão preenchidos automaticamente.
            </div>
          </div>
        </div>
      )}

      {channel === 'whatsapp' && (
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium mb-1">Remetente WhatsApp</div>
            <select
              value={selectedWhatsappSenderId}
              onChange={e => onWhatsappSenderChange(e.target.value)}
              className="input w-full"
            >
              <option value="">Selecione um remetente...</option>
              {whatsappSenders.map(sender => (
                <option key={sender.id} value={sender.id}>{sender.phoneNumber}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Template WhatsApp</div>
            <select
              value={selectedWhatsappTemplateTitle}
              onChange={e => onWhatsappTemplateChange(e.target.value)}
              className="input w-full"
            >
              <option value="">Selecione a template...</option>
              {whatsappTemplates.map(template => (
                <option key={template.title} value={template.title}>{template.title}</option>
              ))}
            </select>
            <div className="text-xs text-slate-500 mt-1">
              As variáveis serão exibidas após selecionar uma template.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
