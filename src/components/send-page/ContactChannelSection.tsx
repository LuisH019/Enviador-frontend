import React from 'react'

interface Props {
  channel: 'whatsapp' | 'email' | 'none'
  headers: string[]
  phoneColumn: string
  emailColumn: string
  showColumnSelector?: boolean
  showSendButton?: boolean
  isSendDisabled?: boolean
  theme: {
    bg: string
    border: string
    btnClass: string
  }
  onPhoneColumnChange: (value: string) => void
  onEmailColumnChange: (value: string) => void
  onSend: () => void
}

export function ContactChannelSection({
  channel,
  headers,
  phoneColumn,
  emailColumn,
  showColumnSelector = true,
  showSendButton = true,
  isSendDisabled = false,
  theme,
  onPhoneColumnChange,
  onEmailColumnChange,
  onSend
}: Props) {
  return (
    <div className="mb-4 space-y-3">
      {/* Contact column selection based on channel */}
      {showColumnSelector && headers.length > 0 && (
        <div className={`mb-4 p-4 rounded ${theme.bg} border ${theme.border}`}>
          <div className="text-sm font-medium mb-2">
            {channel === 'whatsapp' ? 'Coluna de Número' : channel === 'email' ? 'Coluna de Email' : ' Coluna de Contato'}
          </div>
          <select
            value={channel === 'whatsapp' ? phoneColumn : emailColumn}
            onChange={e => {
              if (channel === 'whatsapp') {
                onPhoneColumnChange(e.target.value)
              } else {
                onEmailColumnChange(e.target.value)
              }
            }}
            className="input w-full"
          >
            <option value="">Selecione a coluna...</option>
            {headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <div className="text-xs text-slate-500 mt-2">
            {channel === 'whatsapp'
              ? 'Selecione qual coluna contém o número de telefone dos destinatários.'
              : 'Selecione qual coluna contém o email dos destinatários.'}
          </div>
        </div>
      )}

      {/* Channel selection and Send button */}
      {showSendButton && (
        <div className={`p-4 rounded flex items-end justify-end ${theme.bg} border ${theme.border}`}>
          <button onClick={onSend} disabled={isSendDisabled} className={`btn ${theme.btnClass} disabled:opacity-50 disabled:cursor-not-allowed`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Enviar
          </button>
        </div>
      )}
    </div>
  )
}
