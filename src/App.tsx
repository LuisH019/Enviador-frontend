import React from 'react'
import { useState } from 'react'
import Header from './components/Header'
import Home from './components/Home'
import Footer from './components/Footer'
import SendPage from './components/SendPage'
import { LoginPage } from './components/LoginPage'
import { SignupPage } from './components/SignupPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import AccountPage from './components/AccountPage'

export default function App() {
  const [page, setPage] = useState<'home' | 'send' | 'account' | 'contact' | 'login' | 'signup'>('home')

  // Pages that don't require authentication
  const publicPages = ['home', 'login', 'signup']
  const isPublicPage = publicPages.includes(page)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Show header on all pages except login and signup */}
      {page !== 'login' && page !== 'signup' && (
        <Header onNavigate={setPage} currentPage={page} />
      )}
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {page === 'home' && <Home onNavigate={setPage} />}
        {page === 'login' && <LoginPage onNavigate={setPage} />}
        {page === 'signup' && <SignupPage onNavigate={setPage} />}
        {page === 'send' && (
          <ProtectedRoute onNavigate={setPage}>
            <SendPage onNavigate={setPage} />
          </ProtectedRoute>
        )}
        {page === 'account' && (
          <ProtectedRoute onNavigate={setPage}>
            <AccountPage />
          </ProtectedRoute>
        )}
        {page === 'contact' && (
          <ProtectedRoute onNavigate={setPage}>
            <div>Contato (em breve)</div>
          </ProtectedRoute>
        )}
      </main>

      {/* Show footer on all pages except login and signup */}
      {page !== 'login' && page !== 'signup' && <Footer />}
    </div>
  )
}
