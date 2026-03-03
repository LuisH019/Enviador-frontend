import React, { useMemo, useState } from 'react'
import { AccountSettings, GmailSenderCard, WhatsAppSenderCard } from '../types/accountSettings'
import { getWhatsAppConfigStatus, saveAccountSettings } from '../utils/accountSettingsStorage'
import { accountSettingsService } from '../services/accountSettingsService'
import { useAuth } from '../hooks/useAuth'

export default function AccountPage() {
  const { token } = useAuth()
  const [settings, setSettings] = useState<AccountSettings>(() => accountSettingsService.getCachedSettings())
  const [showWhatsAppSenderForm, setShowWhatsAppSenderForm] = useState(false)
  const [editingWhatsAppSenderId, setEditingWhatsAppSenderId] = useState<string | null>(null)
  const [editingGmailSenderId, setEditingGmailSenderId] = useState<string | null>(null)
  const [showGmailForm, setShowGmailForm] = useState(false)
  const [gmailSaved, setGmailSaved] = useState(false)
  const [whatsappSaved, setWhatsappSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [apiMessage, setApiMessage] = useState('')
  const [templateTarget, setTemplateTarget] = useState<{ channel: 'gmail' | 'whatsapp'; senderId: string } | null>(null)
  const [templateTitleInput, setTemplateTitleInput] = useState('')
  const [templateSubjectInput, setTemplateSubjectInput] = useState('')
  const [templateContentInput, setTemplateContentInput] = useState('')

  const [gmailEmailInput, setGmailEmailInput] = useState(settings.gmail.senderEmail)
  const [gmailPasswordInput, setGmailPasswordInput] = useState(settings.gmail.appPassword)

  const [phoneNumber, setPhoneNumber] = useState(settings.whatsapp.phoneNumber)
  const [accessToken, setAccessToken] = useState(settings.whatsapp.accessToken)
  const [phoneNumberId, setPhoneNumberId] = useState(settings.whatsapp.phoneNumberId)
  const [businessId, setBusinessId] = useState(settings.whatsapp.businessId)

  const whatsappStatus = useMemo(() => getWhatsAppConfigStatus(settings.whatsapp), [settings.whatsapp])
  const whatsappSenderConfigured = settings.whatsappSenders.length > 0

  React.useEffect(() => {
    if (!token) return

    let mounted = true
    setIsLoading(true)
    setApiMessage('')

    accountSettingsService
      .getSettings(token)
      .then((loaded) => {
        if (!mounted) return
        setSettings(loaded)
        setGmailEmailInput(loaded.gmail.senderEmail)
        setGmailPasswordInput(loaded.gmail.appPassword)
        setPhoneNumber(loaded.whatsapp.phoneNumber)
        setAccessToken(loaded.whatsapp.accessToken)
        setPhoneNumberId(loaded.whatsapp.phoneNumberId)
        setBusinessId(loaded.whatsapp.businessId)
      })
      .catch(() => {
        if (!mounted) return
        setApiMessage('Não foi possível carregar configurações do servidor. Exibindo dados locais em cache.')
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [token])

  function maskSecret(value: string): string {
    if (!value) return 'Não configurado'
    if (value.length <= 6) return '••••••'
    return `${value.slice(0, 3)}••••••${value.slice(-3)}`
  }

  function openTemplateEditor(channel: 'gmail' | 'whatsapp', senderId: string) {
    setTemplateTarget({ channel, senderId })
    setTemplateTitleInput('')
    setTemplateSubjectInput('')
    setTemplateContentInput('')
  }

  function closeTemplateEditor() {
    setTemplateTarget(null)
    setTemplateTitleInput('')
    setTemplateSubjectInput('')
    setTemplateContentInput('')
  }

  function handleAddTemplateToSender(channel: 'gmail' | 'whatsapp', senderId: string) {
    const title = templateTitleInput.trim()
    const subject = templateSubjectInput.trim()
    const content = templateContentInput.trim()

    if (!title || !content) {
      setApiMessage('Informe título e conteúdo do template.')
      return
    }

    if (channel === 'gmail' && !subject) {
      setApiMessage('No template de email, o campo assunto é obrigatório.')
      return
    }

    if (channel === 'gmail') {
      const nextGmailSenders = settings.gmailSenders.map(sender => {
        if (sender.id !== senderId) return sender
        const nextTemplates = [
          ...sender.templates.filter(template => template.title !== title),
          { title, subject, content }
        ]
        return { ...sender, templates: nextTemplates }
      })

      setSettings(prev => saveAccountSettings({ ...prev, gmailSenders: nextGmailSenders }))
      closeTemplateEditor()
      return
    }

    const nextWhatsappSenders = settings.whatsappSenders.map(sender => {
      if (sender.id !== senderId) return sender
      const nextTemplates = [
        ...sender.templates.filter(template => template.title !== title),
        { title, content }
      ]
      return { ...sender, templates: nextTemplates }
    })

    const activeSender = nextWhatsappSenders.find(sender =>
      sender.phoneNumber === settings.whatsapp.phoneNumber &&
      sender.phoneNumberId === settings.whatsapp.phoneNumberId &&
      sender.businessId === settings.whatsapp.businessId
    )

    setSettings(prev => saveAccountSettings({
      ...prev,
      whatsappSenders: nextWhatsappSenders,
      whatsapp: activeSender
        ? {
            ...prev.whatsapp,
            templates: activeSender.templates.map(template => template.title)
          }
        : prev.whatsapp
    }))

    closeTemplateEditor()
  }

  function handleDeleteTemplateFromSender(channel: 'gmail' | 'whatsapp', senderId: string, templateTitle: string) {
    if (channel === 'gmail') {
      const nextGmailSenders = settings.gmailSenders.map(sender =>
        sender.id === senderId
          ? { ...sender, templates: sender.templates.filter(template => template.title !== templateTitle) }
          : sender
      )

      setSettings(prev => saveAccountSettings({ ...prev, gmailSenders: nextGmailSenders }))
      return
    }

    const nextWhatsappSenders = settings.whatsappSenders.map(sender =>
      sender.id === senderId
        ? { ...sender, templates: sender.templates.filter(template => template.title !== templateTitle) }
        : sender
    )

    const activeSender = nextWhatsappSenders.find(sender =>
      sender.phoneNumber === settings.whatsapp.phoneNumber &&
      sender.phoneNumberId === settings.whatsapp.phoneNumberId &&
      sender.businessId === settings.whatsapp.businessId
    )

    setSettings(prev => saveAccountSettings({
      ...prev,
      whatsappSenders: nextWhatsappSenders,
      whatsapp: activeSender
        ? {
            ...prev.whatsapp,
            templates: activeSender.templates.map(template => template.title)
          }
        : prev.whatsapp
    }))
  }

  async function handleSaveGmail(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      setApiMessage('Sessão inválida. Faça login novamente para salvar as configurações.')
      return
    }

    const nextSender: GmailSenderCard = {
      id: editingGmailSenderId || crypto.randomUUID(),
      senderEmail: gmailEmailInput.trim(),
      appPassword: gmailPasswordInput,
      templates: settings.gmailSenders.find(sender => sender.id === editingGmailSenderId)?.templates || []
    }

    const existing = settings.gmailSenders
    const senderIndex = existing.findIndex(sender => sender.id === nextSender.id)
    const nextSenders =
      senderIndex >= 0
        ? existing.map(sender => (sender.id === nextSender.id ? nextSender : sender))
        : [...existing, nextSender]

    const next: AccountSettings = {
      ...settings,
      gmail: nextSender,
      gmailSenders: nextSenders
    }

    setIsSaving(true)
    setApiMessage('')
    try {
      const saved = await accountSettingsService.saveGmailSettings(token, next.gmail)
      const merged = saveAccountSettings({
        ...saved,
        gmailSenders: next.gmailSenders
      })
      setSettings(merged)
      setGmailEmailInput(merged.gmail.senderEmail)
      setGmailPasswordInput(merged.gmail.appPassword)
      setShowGmailForm(false)
      setEditingGmailSenderId(null)
      setGmailSaved(true)
      setTimeout(() => setGmailSaved(false), 2500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar Gmail no backend.'
      setApiMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteGmailSender() {
    if (editingGmailSenderId) {
      await handleDeleteGmailSenderById(editingGmailSenderId)
      return
    }

    setApiMessage('Selecione um card específico para excluir.')
  }

  async function handleDeleteGmailSenderById(senderId: string) {
    if (!token) {
      setApiMessage('Sessão inválida. Faça login novamente para salvar as configurações.')
      return
    }

    if (!confirm('Deseja excluir este remetente de Gmail?')) return

    const remaining = settings.gmailSenders.filter(sender => sender.id !== senderId)
    const nextActive = remaining[0]

    setIsSaving(true)
    setApiMessage('')
    try {
      const saved = await accountSettingsService.saveGmailSettings(token, nextActive || {
        senderEmail: '',
        appPassword: ''
      })
      const merged = saveAccountSettings({
        ...saved,
        gmailSenders: remaining
      })

      setSettings(merged)
      setGmailEmailInput(merged.gmail.senderEmail)
      setGmailPasswordInput(merged.gmail.appPassword)
      setShowGmailForm(false)
      setEditingGmailSenderId(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao excluir remetente de Gmail.'
      setApiMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveWhatsAppSender(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      setApiMessage('Sessão inválida. Faça login novamente para salvar as configurações.')
      return
    }

    const nextSender: WhatsAppSenderCard = {
      id: editingWhatsAppSenderId || crypto.randomUUID(),
      phoneNumber: phoneNumber.trim(),
      accessToken: accessToken.trim(),
      phoneNumberId: phoneNumberId.trim(),
      businessId: businessId.trim(),
      templates: settings.whatsappSenders.find(sender => sender.id === editingWhatsAppSenderId)?.templates || []
    }

    const nextWhatsapp: AccountSettings['whatsapp'] = {
      phoneNumber: nextSender.phoneNumber,
      accessToken: nextSender.accessToken,
      phoneNumberId: nextSender.phoneNumberId,
      businessId: nextSender.businessId,
      templates: nextSender.templates.map(template => template.title)
    }

    const existing = settings.whatsappSenders
    const senderIndex = existing.findIndex(sender => sender.id === nextSender.id)
    const nextSenders =
      senderIndex >= 0
        ? existing.map(sender => (sender.id === nextSender.id ? nextSender : sender))
        : [...existing, nextSender]

    const next: AccountSettings = {
      ...settings,
      whatsapp: nextWhatsapp,
      whatsappSenders: nextSenders
    }

    setIsSaving(true)
    setApiMessage('')
    try {
      const saved = await accountSettingsService.saveWhatsAppSettings(token, next.whatsapp)
      const merged = saveAccountSettings({
        ...saved,
        whatsappSenders: next.whatsappSenders
      })

      setSettings(merged)
      setPhoneNumber(merged.whatsapp.phoneNumber)
      setAccessToken(merged.whatsapp.accessToken)
      setPhoneNumberId(merged.whatsapp.phoneNumberId)
      setBusinessId(merged.whatsapp.businessId)
      setWhatsappSaved(true)
      setShowWhatsAppSenderForm(false)
      setEditingWhatsAppSenderId(null)
      setTimeout(() => setWhatsappSaved(false), 2500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar remetente de WhatsApp no backend.'
      setApiMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteWhatsAppSender() {
    if (editingWhatsAppSenderId) {
      await handleDeleteWhatsAppSenderById(editingWhatsAppSenderId)
      return
    }

    setApiMessage('Selecione um card específico para excluir.')
  }

  async function handleDeleteWhatsAppSenderById(senderId: string) {
    if (!token) {
      setApiMessage('Sessão inválida. Faça login novamente para salvar as configurações.')
      return
    }

    if (!confirm('Deseja excluir este remetente de WhatsApp?')) return

    const remaining = settings.whatsappSenders.filter(sender => sender.id !== senderId)
    const nextActive = remaining[0]

    setIsSaving(true)
    setApiMessage('')
    try {
      const saved = await accountSettingsService.saveWhatsAppSettings(
        token,
        nextActive
          ? {
              phoneNumber: nextActive.phoneNumber,
              accessToken: nextActive.accessToken,
              phoneNumberId: nextActive.phoneNumberId,
              businessId: nextActive.businessId,
              templates: nextActive.templates.map(template => template.title)
            }
          : {
              phoneNumber: '',
              accessToken: '',
              phoneNumberId: '',
              businessId: '',
              templates: []
            }
      )

      const merged = saveAccountSettings({
        ...saved,
        whatsappSenders: remaining
      })

      setSettings(merged)
      setPhoneNumber(merged.whatsapp.phoneNumber)
      setAccessToken(merged.whatsapp.accessToken)
      setPhoneNumberId(merged.whatsapp.phoneNumberId)
      setBusinessId(merged.whatsapp.businessId)
      setShowWhatsAppSenderForm(false)
      setEditingWhatsAppSenderId(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao excluir remetente de WhatsApp.'
      setApiMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  function handleCreateNewWhatsAppSender() {
    setEditingWhatsAppSenderId(null)
    setPhoneNumber('')
    setAccessToken('')
    setPhoneNumberId('')
    setBusinessId('')
    setShowWhatsAppSenderForm(true)
  }

  function handleCreateNewGmailSender() {
    setEditingGmailSenderId(null)
    setGmailEmailInput('')
    setGmailPasswordInput('')
    setShowGmailForm(true)
  }

  function handleEditGmailSender(sender: GmailSenderCard) {
    setEditingGmailSenderId(sender.id)
    setGmailEmailInput(sender.senderEmail)
    setGmailPasswordInput(sender.appPassword)
    setShowGmailForm(true)
  }

  function handleSelectGmailSender(sender: GmailSenderCard) {
    setSettings(prev => saveAccountSettings({
      ...prev,
      gmail: {
        senderEmail: sender.senderEmail,
        appPassword: sender.appPassword
      }
    }))

    setEditingGmailSenderId(sender.id)
    setGmailEmailInput(sender.senderEmail)
    setGmailPasswordInput(sender.appPassword)
  }

  function handleEditWhatsAppSender(sender: WhatsAppSenderCard) {
    setEditingWhatsAppSenderId(sender.id)
    setPhoneNumber(sender.phoneNumber)
    setAccessToken(sender.accessToken)
    setPhoneNumberId(sender.phoneNumberId)
    setBusinessId(sender.businessId)
    setShowWhatsAppSenderForm(true)
  }

  function handleSelectWhatsAppSender(sender: WhatsAppSenderCard) {
    setSettings(prev => saveAccountSettings({
      ...prev,
      whatsapp: {
        phoneNumber: sender.phoneNumber,
        accessToken: sender.accessToken,
        phoneNumberId: sender.phoneNumberId,
        businessId: sender.businessId,
        templates: sender.templates.map(template => template.title)
      }
    }))

    setEditingWhatsAppSenderId(sender.id)
    setPhoneNumber(sender.phoneNumber)
    setAccessToken(sender.accessToken)
    setPhoneNumberId(sender.phoneNumberId)
    setBusinessId(sender.businessId)
  }

  function renderTemplateSection(channel: 'gmail' | 'whatsapp', senderId: string, templates: Array<{ title: string; content: string; subject?: string }>) {
    const isEditingThisCard = templateTarget?.channel === channel && templateTarget.senderId === senderId

    return (
      <div className="mt-3 rounded-lg border border-slate-200 bg-white/80 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-700">Templates</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => (isEditingThisCard ? closeTemplateEditor() : openTemplateEditor(channel, senderId))}
          >
            {isEditingThisCard ? 'Cancelar template' : 'Adicionar template'}
          </button>
        </div>

        {templates.length > 0 ? (
          <div className="space-y-2">
            {templates.map(template => (
              <details key={template.title} className="rounded border border-slate-200 bg-white px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium text-slate-800">{template.title}</summary>
                {channel === 'gmail' && (
                  <p className="mt-2 text-sm text-slate-700"><span className="font-medium">Assunto:</span> {template.subject || 'Sem assunto.'}</p>
                )}
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{template.content || 'Sem conteúdo.'}</p>
                <button
                  type="button"
                  className="btn btn-ghost mt-2"
                  onClick={() => handleDeleteTemplateFromSender(channel, senderId, template.title)}
                >
                  Excluir template
                </button>
              </details>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Nenhum template cadastrado neste card.</p>
        )}

        {isEditingThisCard && (
          <div className="space-y-2 border-t border-slate-200 pt-2">
            <input
              type="text"
              value={templateTitleInput}
              onChange={(e) => setTemplateTitleInput(e.target.value)}
              placeholder="Título do template"
              className="input w-full"
            />
            {channel === 'gmail' && (
              <input
                type="text"
                value={templateSubjectInput}
                onChange={(e) => setTemplateSubjectInput(e.target.value)}
                placeholder="Assunto do email"
                className="input w-full"
              />
            )}
            <textarea
              value={templateContentInput}
              onChange={(e) => setTemplateContentInput(e.target.value)}
              placeholder="Conteúdo do template"
              rows={3}
              className="input w-full"
            />
            <button type="button" className="btn btn-primary" onClick={() => handleAddTemplateToSender(channel, senderId)}>
              Salvar template
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="max-w-4xl mx-auto space-y-6">
      <div className="card p-6">
        <h2 className="text-2xl font-semibold text-slate-900">Conta</h2>
        <p className="text-sm text-slate-600 mt-1">
          Configure e visualize as credenciais de Gmail e WhatsApp Business para habilitar o envio.
        </p>
        {isLoading && <p className="text-sm text-slate-500 mt-2">Carregando configurações da conta...</p>}
        {apiMessage && <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-2">{apiMessage}</p>}
      </div>

      <div className="card p-6 space-y-4 bg-red-50/80 border-2 border-red-300 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Gmail</h3>
            <p className="text-sm text-slate-600">Configuração usada para envios por email.</p>
          </div>
          {gmailSaved && <span className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-1">Configuração salva</span>}
        </div>
        <div className="rounded-lg border-2 border-red-300 bg-white/85 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Cadastrar remetente</h4>
          </div>

          {settings.gmailSenders.length > 0 ? (
            <div className="space-y-2 text-sm">
              {settings.gmailSenders.map((sender) => {
                const isActive = sender.senderEmail === settings.gmail.senderEmail

                return (
                  <div
                    key={sender.id}
                    className={`rounded-lg border p-3 ${isActive ? 'border-red-400 bg-red-50' : 'border-red-200 bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div><span className="text-slate-500">Remetente:</span> <span className="font-medium text-slate-900">{sender.senderEmail}</span></div>
                        <div><span className="text-slate-500">Senha de app:</span> <span className="font-medium text-slate-900">{maskSecret(sender.appPassword)}</span></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" className="btn btn-ghost" onClick={() => handleSelectGmailSender(sender)}>
                          {isActive ? 'Ativo' : 'Selecionar'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => handleEditGmailSender(sender)}>
                          Editar
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => handleDeleteGmailSenderById(sender.id)} disabled={isSaving}>
                          Excluir
                        </button>
                      </div>
                    </div>
                    {renderTemplateSection('gmail', sender.id, sender.templates)}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600">Nenhum remetente de Gmail cadastrado.</p>
          )}

          <button type="button" className="btn btn-primary" onClick={handleCreateNewGmailSender}>
            Adicionar remetente Gmail
          </button>
        </div>

        {showGmailForm && (
          <form onSubmit={handleSaveGmail} className="space-y-3 border-2 border-red-300 rounded-lg p-4 bg-white/80">
            <div>
              <label htmlFor="account-gmail-email" className="block text-sm font-medium text-gray-700 mb-1">Email remetente</label>
              <input
                id="account-gmail-email"
                type="email"
                value={gmailEmailInput}
                onChange={(e) => setGmailEmailInput(e.target.value)}
                placeholder="seu.email@gmail.com"
                className="input w-full"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="account-gmail-password" className="block text-sm font-medium text-gray-700 mb-1">Senha de app Gmail</label>
              <input
                id="account-gmail-password"
                name="account-gmail-password"
                type="password"
                value={gmailPasswordInput}
                onChange={(e) => setGmailPasswordInput(e.target.value)}
                placeholder="Cole sua senha de app"
                className="input w-full"
                autoComplete="new-password"
              />
              <p className="text-xs text-slate-500 mt-1">
                Gere em: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-red-600 hover:underline">Google App Passwords</a>
              </p>
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Gmail'}</button>
          </form>
        )}
      </div>

      <div className="card p-6 space-y-4 bg-green-50/80 border-2 border-green-300 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">WhatsApp Business</h3>
            <p className="text-sm text-slate-600">Somente templates aprovados pela Meta são aceitos para envio.</p>
          </div>
          {whatsappSaved && <span className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-1">Cadastro salvo</span>}
        </div>
        <div className="rounded-lg border-2 border-green-300 bg-white/85 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Cadastrar remetente</h4>
          </div>

          {whatsappSenderConfigured ? (
            <div className="space-y-2">
              {settings.whatsappSenders.map((sender) => {
                const isActive =
                  sender.phoneNumber === settings.whatsapp.phoneNumber &&
                  sender.phoneNumberId === settings.whatsapp.phoneNumberId &&
                  sender.businessId === settings.whatsapp.businessId

                return (
                  <div
                    key={sender.id}
                    className={`rounded-lg border p-3 text-sm ${isActive ? 'border-green-400 bg-green-50' : 'border-green-200 bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div><span className="text-slate-500">Número:</span> <span className="font-medium text-slate-900">{sender.phoneNumber}</span></div>
                        <div><span className="text-slate-500">Access Token:</span> <span className="font-medium text-slate-900">{maskSecret(sender.accessToken)}</span></div>
                        <div><span className="text-slate-500">Phone Number ID:</span> <span className="font-medium text-slate-900">{sender.phoneNumberId}</span></div>
                        <div><span className="text-slate-500">Business ID:</span> <span className="font-medium text-slate-900">{sender.businessId}</span></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" className="btn btn-ghost" onClick={() => handleSelectWhatsAppSender(sender)}>
                          {isActive ? 'Ativo' : 'Selecionar'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => handleEditWhatsAppSender(sender)}>
                          Editar
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => handleDeleteWhatsAppSenderById(sender.id)} disabled={isSaving}>
                          Excluir
                        </button>
                      </div>
                    </div>
                    {renderTemplateSection('whatsapp', sender.id, sender.templates)}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600">Nenhum remetente de WhatsApp cadastrado.</p>
          )}

          <button type="button" onClick={handleCreateNewWhatsAppSender} className="btn btn-primary">
            Adicionar remetente WhatsApp
          </button>
        </div>

        {showWhatsAppSenderForm && (
          <form onSubmit={handleSaveWhatsAppSender} className="space-y-3 border-2 border-green-300 rounded-lg p-4 bg-white/80">
            <div>
              <label htmlFor="wa-phone-number" className="block text-sm font-medium text-gray-700 mb-1">Número de telefone</label>
              <input
                id="wa-phone-number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="5541999999999"
                className="input w-full"
              />
            </div>

            <div>
              <label htmlFor="wa-access-token" className="block text-sm font-medium text-gray-700 mb-1">Token de acesso</label>
              <input
                id="wa-access-token"
                name="wa-access-token"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Access Token do WhatsApp Business"
                className="input w-full"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="wa-phone-number-id" className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID</label>
              <input
                id="wa-phone-number-id"
                type="text"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="Identificador do número"
                className="input w-full"
              />
            </div>

            <div>
              <label htmlFor="wa-business-id" className="block text-sm font-medium text-gray-700 mb-1">Business ID</label>
              <input
                id="wa-business-id"
                type="text"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                placeholder="Identificador do Business Manager"
                className="input w-full"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar remetente WhatsApp'}</button>
          </form>
        )}

      </div>
    </section>
  )
}
