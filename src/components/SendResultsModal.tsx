import React from 'react'
import { JobState } from '../hooks/useJobPolling'

type Props = {
  job: JobState
  onClose?: () => void
}

export default function SendResultsModal({ job, onClose }: Props) {
  if (!job) return null

  const hasFailures = job.failed > 0
  const failures = job.items.filter((it: any) => it.status === 'failed')
  const successes = job.items.filter((it: any) => it.status === 'success')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-2xl p-3 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          {hasFailures ? (
            <>
              <span className="text-3xl">⚠️</span>
              <div>
                <h2 className="text-lg font-bold text-red-700">Envio com Problemas</h2>
                <p className="text-xs text-slate-600">{job.failed} erro(s)</p>
              </div>
            </>
          ) : (
            <>
              <span className="text-3xl">✅</span>
              <div>
                <h2 className="text-lg font-bold text-green-700">Sucesso!</h2>
                <p className="text-xs text-slate-600">{job.success} enviado(s)</p>
              </div>
            </>
          )}
        </div>

        {/* Summary */}
        <div className="mb-3 p-2 bg-slate-100 rounded">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-lg font-bold text-blue-600">{job.total}</div>
              <div className="text-slate-600">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">✓ {job.success}</div>
              <div className="text-slate-600">OK</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">✗ {job.failed}</div>
              <div className="text-slate-600">Erros</div>
            </div>
          </div>
        </div>

        {/* Content: show failures if any, otherwise show successes */}
        {hasFailures ? (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-red-700">Problemas ({job.failed})</h3>
            <div className="max-h-48 overflow-y-auto space-y-1 bg-red-50 p-2 rounded border border-red-200">
              {failures.map((it: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2 p-1 bg-white rounded border-l-2 border-red-500">
                  <span className="text-lg flex-shrink-0">❌</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-red-900 truncate">{it.email}</div>
                    <div className="text-xs text-red-700 line-clamp-2">{it.message || 'Erro desconhecido'}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Show successes below if there are any */}
            {job.success > 0 && (
              <div className="mt-2">
                <h3 className="text-sm font-semibold mb-1 text-green-700">Sucesso ({job.success})</h3>
                <div className="max-h-20 overflow-y-auto space-y-0 bg-green-50 p-2 rounded border border-green-200">
                  {successes.slice(0, 15).map((it: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-1 text-xs text-green-800">
                      <span>✓</span>
                      <span className="truncate">{it.email}</span>
                    </div>
                  ))}
                  {job.success > 15 && (
                    <div className="text-xs text-green-600">... +{job.success - 15}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-green-700">Emails Enviados ({job.success})</h3>
            <div className="max-h-48 overflow-y-auto space-y-0 bg-green-50 p-2 rounded border border-green-200">
              {successes.slice(0, 30).map((it: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1 text-xs text-green-800">
                  <span>✓</span>
                  <span className="truncate">{it.email}</span>
                </div>
              ))}
              {job.success > 30 && (
                <div className="text-xs text-green-600">... +{job.success - 30}</div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              const csv = [
                ['Email', 'Status', 'Mensagem'].join(','),
                ...job.items.map((it: any) =>
                  [it.email, it.status, it.message || '']
                    .map(v => `"${String(v).replace(/"/g, '""')}"`)
                    .join(',')
                )
              ].join('\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `envio-${new Date().toISOString().slice(0, 10)}.csv`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="flex-1 btn btn-sm btn-outline"
          >
            Download CSV
          </button>
          <button
            onClick={() => onClose && onClose()}
            className={`flex-1 btn btn-sm ${hasFailures ? 'btn-outline text-red-600' : 'btn-primary'}`}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
