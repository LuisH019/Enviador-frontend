import React, { useRef, useState } from 'react'
import { formatBytes } from '../../utils/fileUtils'

interface Props {
  attachments: File[]
  headers: string[]
  fileColumn: string
  matchMode: 'igual' | 'contem' | 'comeca_com' | 'termina_com'
  theme: {
    bg: string
    border: string
    accent: string
    btnClass: string
  }
  onAddFiles: (files: FileList | null) => void
  onRemoveFile: (index: number) => void
  onClearAll: () => void
  onFileColumnChange: (column: string) => void
  onMatchModeChange: (mode: 'igual' | 'contem' | 'comeca_com' | 'termina_com') => void
}

export function AttachmentsSection({
  attachments,
  headers,
  fileColumn,
  matchMode,
  theme,
  onAddFiles,
  onRemoveFile,
  onClearAll,
  onFileColumnChange,
  onMatchModeChange
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const radioStyle = `w-4 h-4 border-2 rounded-full focus:ring-2 focus:outline-none appearance-none cursor-pointer`
  
  // Mapear cor do tema
  const getCheckedColor = () => {
    if (theme.accent.includes('green')) return '#16a34a'
    if (theme.accent.includes('red')) return '#dc2626'
    if (theme.accent.includes('blue')) return '#4f46e5'
    return '#4f46e5'
  }
  
  const checkedColor = getCheckedColor()

  return (
    <div className={`mb-4 p-4 rounded ${theme.bg} border-2 ${theme.border}`}>
      <input ref={inputRef} type="file" multiple onChange={e => onAddFiles(e.target.files)} className="hidden" />

      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); onAddFiles(e.dataTransfer?.files ?? null) }}
        className={`border-dashed border-2 rounded p-4 flex items-center justify-between gap-3 ${theme.border}`}
      >
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h6l6 6v3a4 4 0 01-4 4H7z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v6m0 0l-3-3m3 3l3-3" />
          </svg>
          <div>
            <div className="font-medium">Adicionar anexos</div>
            <div className="text-xs text-slate-500">Arraste aqui ou <button onClick={() => inputRef.current?.click()} className={`underline ${theme.accent}`}>selecione arquivos</button></div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {attachments.length > 0 && (
            <div className="text-sm text-slate-600">{attachments.length} arquivo(s) • {formatBytes(attachments.reduce((s,f) => s + f.size, 0))}</div>
          )}
          <button onClick={() => inputRef.current?.click()} className={`btn ${theme.btnClass}`}>Adicionar</button>
          {attachments.length > 0 && (
            <button onClick={onClearAll} className="btn btn-ghost text-red-600">Limpar tudo</button>
          )}
        </div>
      </div>

      {attachments.length > 0 && (
        <>
          <div className="mt-4">
            <div className="text-sm font-medium mb-1">Anexos</div>
            <ul className="text-sm">
              {attachments.map((f, idx) => (
                <li key={idx} className="flex items-center justify-between py-1">
                  <span>{f.name} ({formatBytes(f.size)})</span>
                  <div className="flex gap-2">
                    <button onClick={() => onRemoveFile(idx)} className="text-xs text-red-600 hover:underline">Remover</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded">
            <div className="text-sm font-medium mb-2">Vincular arquivos à:</div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <select value={fileColumn} onChange={e => onFileColumnChange(e.target.value)} className="input w-full">
                  <option value="">Nenhuma coluna (enviar os mesmos para todos)</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div className='mt-4'>
              <div className="text-sm font-medium mb-2">Opções de vinculação:</div>

              <div className='flex items-end justify-between'>
                <div className='flex items-center'>
                  <input 
                    id="igual" 
                    type="radio" 
                    name="match-mode"
                    value="igual" 
                    checked={matchMode === 'igual'}
                    onChange={e => onMatchModeChange(e.target.value as any)}
                    className={`border-2 ${theme.border} ${radioStyle}`} 
                  />
                  <label htmlFor="igual" className="select-none ms-2 text-xs font-medium text-heading">Igual à coluna selecionada</label>
                </div>

                <div className='flex items-center'>
                  <input 
                    id="contem" 
                    type="radio" 
                    name="match-mode"
                    value="contem" 
                    checked={matchMode === 'contem'}
                    onChange={e => onMatchModeChange(e.target.value as any)}
                    className={`border-2 ${theme.border} ${radioStyle}`}
                  />
                  <label htmlFor="contem" className="select-none ms-2 text-xs font-medium text-heading">Contém a coluna selecionada</label>
                </div>

                <div className='flex items-center'>
                  <input 
                    id="comeca_com" 
                    type="radio" 
                    name="match-mode"
                    value="comeca_com" 
                    checked={matchMode === 'comeca_com'}
                    onChange={e => onMatchModeChange(e.target.value as any)}
                    className={`border-2 ${theme.border} ${radioStyle}`}
                  />
                  <label htmlFor="comeca_com" className="select-none ms-2 text-xs font-medium text-heading">Começa com a coluna selecionada</label>
                </div>

                <div className='flex items-center'>
                  <input 
                    id="termina_com" 
                    type="radio" 
                    name="match-mode"
                    value="termina_com" 
                    checked={matchMode === 'termina_com'}
                    onChange={e => onMatchModeChange(e.target.value as any)}
                    className={`border-2 ${theme.border} ${radioStyle}`}
                  />
                  <label htmlFor="termina_com" className="select-none ms-2 text-xs font-medium text-heading">Termina com a coluna selecionada</label>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        input[type='radio'][class*='w-4']:checked {
          background-color: ${checkedColor};
          border-color: ${checkedColor};
        }
      `}</style>
    </div>
  )
}
