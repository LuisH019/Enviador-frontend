import React from 'react'
import RichTextInput from '../RichTextInput'

interface Props {
  headers: string[]
  message: string
  readOnly?: boolean
  readOnlyHint?: string
  theme: {
    bg: string
    border: string
    accent: string
  }
  onMessageChange: (value: string) => void
  onInsertPlaceholder: (placeholder: string) => void
}

export function MessageSection({ headers, message, readOnly = false, readOnlyHint = '', theme, onMessageChange, onInsertPlaceholder }: Props) {
  return (
    <div className={`mb-4 p-4 rounded ${theme.bg} border ${theme.border}`}>
      <h3 className="font-medium mb-2">Mensagem</h3> 
      <p className="text-sm text-slate-500 mb-2">
        Use placeholders baseados nos cabeçalhos: 
        {headers.map(h => 
          <button 
            key={h} 
            disabled={readOnly}
            onClick={() => onInsertPlaceholder(h)} 
            className={`ml-2 ${theme.accent} hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {'{' + h + '}'}
          </button>
        )}
      </p>
      {readOnly && readOnlyHint && (
        <p className="text-xs text-slate-500 mb-2">{readOnlyHint}</p>
      )}
      <RichTextInput
        value={message}
        onChange={onMessageChange}
        readOnly={readOnly}
        placeholder="Texto da mensagem."
        minHeightClassName="min-h-[120px]"
      />
    </div>
  )
}
