import React, { useEffect, useState } from 'react'
import { useJobPolling } from '../hooks/useJobPolling'
import SendResultsModal from './SendResultsModal'

type Props = {
  jobId: string | null
  token: string | null
  onClose?: () => void
}

export default function SendProgressModal({ jobId, token, onClose }: Props) {
  const { job, cancelJob } = useJobPolling(jobId, token, 1000)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (job && (job.state === 'done' || job.state === 'error')) {
      setShowResults(true)
    }
  }, [job?.state])

  if (!jobId) return null

  // Show results modal when job is complete
  if (showResults && job) {
    return <SendResultsModal job={job} onClose={() => { setShowResults(false); onClose && onClose() }} />
  }

  const percent = job && job.total ? Math.round((job.processed / job.total) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Progresso do envio</h3>
          <div className="text-sm text-slate-600">Estado: {job?.state ?? '...'}</div>
        </div>

        <div className="mb-4">
          <div className="h-4 w-full bg-slate-200 rounded overflow-hidden">
            <div className="h-4 bg-blue-600 rounded" style={{ width: `${percent}%` }} />
          </div>
          <div className="text-sm text-slate-600 mt-2">{job?.processed ?? 0} / {job?.total ?? 0} ({percent}%)</div>
        </div>

        <div className="mb-4 max-h-48 overflow-y-auto bg-slate-50 p-2 rounded">
          <ul className="text-sm">
            {job?.items?.slice().reverse().slice(0, 50).map((it: any, idx: number) => (
              <li key={idx} className="flex items-start justify-between py-1">
                <div className="truncate pr-4">
                  <span className="font-medium">{it.email}</span>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    {it.status === 'success' ? (
                      <span className="text-xs">✓</span>
                    ) : it.status === 'failed' ? (
                      <span className="text-lg">X</span>
                    ) : (
                      <span>...</span>
                    )}
                    {it.message ? `— ${it.message}` : it.status}
                  </div>
                </div>
                <div className="text-xs text-slate-400">#{it.index}</div>
              </li>
            ))}
            {!job?.items?.length && <li className="text-sm text-slate-500">Nenhuma atualização ainda.</li>}
          </ul>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">Sucesso: {job?.success ?? 0} • Falhas: {job?.failed ?? 0}</div>
          <div className="flex gap-2">
            <button onClick={() => { cancelJob() }} className="btn btn-ghost text-red-600">Cancelar</button>
            <button onClick={() => { onClose && onClose() }} className="btn btn-primary">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
