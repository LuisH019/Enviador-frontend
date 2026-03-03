import React from 'react'
import logoUrl from '../assets/logo.svg'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

type HeaderProps = {
  onNavigate?: (page: 'home' | 'send' | 'account' | 'contact' | 'login' | 'signup') => void
  currentPage?: 'home' | 'send' | 'account' | 'contact' | 'login' | 'signup'
}

export default function Header({ onNavigate, currentPage = 'home' }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  const navItems = [
    { key: 'home', label: 'Início' },
    { key: 'send', label: 'Enviar' },
    { key: 'account', label: 'Conta' },
    { key: 'contact', label: 'Contato' }
  ] as const

  const navClass = (p: string) =>
    `px-3 py-2 rounded-md text-sm font-medium ${currentPage === p ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`

  const handleLogout = async () => {
    await logout()
    setOpen(false)
    onNavigate?.('login')
  }

  return (
    <header className="bg-white shadow-sm relative">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Rio Software" className="w-10 h-10 rounded-md" />
          <div>
            <div className="font-semibold text-lg">Enviador</div>
            <div className="text-xs text-slate-500">Enviar mensagens em massa</div>
          </div>
        </div>

        <nav className="hidden md:flex gap-4 items-center">
          {navItems.map(n => (
            <button key={n.key} onClick={() => onNavigate?.(n.key as any)} className={navClass(n.key as any)}>
              {n.label}
            </button>
          ))}
          
          {isAuthenticated ? (
            <div className="flex items-center gap-4 ml-4 border-l pl-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.first_name || user?.username}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-ghost text-sm"
              >
                Sair
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => onNavigate?.('login')} className="btn btn-ghost ml-4">
                Entrar
              </button>
              <button onClick={() => onNavigate?.('signup')} className="btn btn-primary">
                Cadastrar
              </button>
            </>
          )}
        </nav>

        <div className="md:hidden">
          <button aria-label="menu" className="p-2" onClick={() => setOpen(v => !v)}>{open ? '✕' : '☰'}</button>
        </div>
      </div>

      {open && (
        <div className="md:hidden absolute left-0 right-0 bg-white border-t shadow-sm">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map(n => (
              <button key={n.key} onClick={() => { setOpen(false); onNavigate?.(n.key as any) }} className={`text-left ${navClass(n.key as any)}`}>
                {n.label}
              </button>
            ))}
            
            {isAuthenticated ? (
              <div className="mt-4 pt-4 border-t space-y-2">
                <p className="text-sm font-medium text-gray-900">{user?.first_name || user?.username}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <button
                  onClick={handleLogout}
                  className="btn btn-ghost w-full justify-start text-sm mt-2"
                >
                  Sair
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => { setOpen(false); onNavigate?.('login') }} className="btn btn-ghost w-full mt-2">
                  Entrar
                </button>
                <button onClick={() => { setOpen(false); onNavigate?.('signup') }} className="btn btn-primary w-full">
                  Cadastrar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
} 
