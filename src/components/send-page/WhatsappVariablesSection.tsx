import React from 'react'

type VariableBinding = {
  mode: 'column' | 'fixed'
  column: string
  value: string
}

type Props = {
  show: boolean
  headers: string[]
  variables: string[]
  bindings: Record<string, VariableBinding>
  theme: {
    bg: string
    border: string
  }
  selectedTemplateExists: boolean
  onBindingChange: (variable: string, binding: VariableBinding) => void
}

export function WhatsappVariablesSection({
  show,
  headers,
  variables,
  bindings,
  theme,
  selectedTemplateExists,
  onBindingChange
}: Props) {
  if (!show) return null

  return (
    <div className={`mb-4 p-4 rounded ${theme.bg} border ${theme.border} space-y-3`}>
      <h3 className="font-medium">Variáveis da template WhatsApp</h3>

      {!selectedTemplateExists ? (
        <p className="text-sm text-slate-500">Selecione uma template na seção de canal para configurar variáveis.</p>
      ) : variables.length === 0 ? (
        <p className="text-sm text-slate-500">A template selecionada não possui variáveis.</p>
      ) : (
        <div className="space-y-3">
          {variables.map(variable => {
            const binding = bindings[variable] || { mode: 'column' as const, column: '', value: '' }

            return (
              <div key={variable} className="rounded border border-green-200 bg-white p-3">
                <div className="text-sm font-medium text-slate-800 mb-2">{`{${variable}}`}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <select
                    value={binding.mode}
                    onChange={e => {
                      const mode = e.target.value as 'column' | 'fixed'
                      onBindingChange(variable, {
                        ...binding,
                        mode,
                        column: mode === 'column' ? binding.column || '' : '',
                        value: mode === 'fixed' ? binding.value || '' : ''
                      })
                    }}
                    className="input"
                  >
                    <option value="column">Vincular com coluna</option>
                    <option value="fixed">Valor fixo</option>
                  </select>

                  {binding.mode === 'column' ? (
                    <select
                      value={binding.column}
                      onChange={e => onBindingChange(variable, { ...binding, mode: 'column', column: e.target.value })}
                      className="input md:col-span-2"
                    >
                      <option value="">Selecione a coluna</option>
                      {headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={binding.value}
                      onChange={e => onBindingChange(variable, { ...binding, mode: 'fixed', value: e.target.value })}
                      placeholder="Digite o valor fixo"
                      className="input md:col-span-2"
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
