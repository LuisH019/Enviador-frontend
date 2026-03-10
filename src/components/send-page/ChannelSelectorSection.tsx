import React from 'react'

type Props = {
  channel: 'whatsapp' | 'email' | 'none'
  isWhatsappEnabled: boolean
  isEmailEnabled: boolean
  theme: {
    bg: string
    border: string
  }
  onChannelChange: (channel: 'whatsapp' | 'email') => void
  onNavigateToAccount?: () => void
}

export function ChannelSelectorSection({
  channel,
  isWhatsappEnabled,
  isEmailEnabled,
  theme,
  onChannelChange,
  onNavigateToAccount
}: Props) {
  const bothChannelsUnavailable = !isEmailEnabled && !isWhatsappEnabled

  return (
    <div className={`mb-4 p-4 rounded ${theme.bg} border ${theme.border} flex items-end justify-between`}>
      <div>
        <div className="text-sm font-medium mb-1">Canal</div>
        <div className="flex gap-2">
          <label className={`btn ${channel === 'whatsapp' ? 'btn-success' : 'btn-ghost'} ${!isWhatsappEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              className="hidden"
              type="radio"
              name="channel"
              checked={channel === 'whatsapp'}
              disabled={!isWhatsappEnabled}
              onChange={() => onChannelChange('whatsapp')}
            />
            WhatsApp
          </label>
          <label className={`btn ${channel === 'email' ? 'btn-danger' : 'btn-ghost'} ${!isEmailEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              className="hidden"
              type="radio"
              name="channel"
              checked={channel === 'email'}
              disabled={!isEmailEnabled}
              onChange={() => onChannelChange('email')}
            />
            Email
          </label>
        </div>
        {bothChannelsUnavailable && (
          <div className="mt-3">
            <button type="button" className="btn btn-primary" onClick={onNavigateToAccount}>
              Configurar remetente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
