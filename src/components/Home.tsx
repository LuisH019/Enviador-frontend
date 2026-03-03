import React from 'react'

type HomeProps = { onNavigate?: (page: 'home' | 'send' | 'account' | 'contact') => void }

export default function Home({ onNavigate }: HomeProps) {
  return (
    <section className="py-12">
      <div className="card p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <div className="kicker mb-2">Plataforma</div>
          <h1 className="h1 mb-4">Envie mensagens por WhatsApp ou Email com facilidade</h1>
          <p className="text-slate-600 mb-6 max-w-xl">Prepare listas, edite mensagens com placeholders e envie em massa com controle e visibilidade.</p>
          <div className="flex gap-3">
            <button onClick={() => onNavigate?.('send')} className="btn btn-primary">Criar envio</button>
            <button className="btn btn-ghost">Documentação</button>
          </div>
        </div>
        <div className="hidden md:block w-64 h-40 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-semibold">Preview</div>
      </div>
    </section>
  )
} 
