import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { config } from '../config'
import SendProgressModal from './SendProgressModal'
import ErrorModal from './ErrorModal'
import { FileUploadSection } from './send-page/FileUploadSection'
import { ManualCreateSection } from './send-page/ManualCreateSection'
import { DataTableSection } from './send-page/DataTableSection'
import { AttachmentsSection } from './send-page/AttachmentsSection'
import { MessageSection } from './send-page/MessageSection'
import { ContactChannelSection } from './send-page/ContactChannelSection'
import { AttachmentWarningsModal } from './send-page/AttachmentWarningsModal'
import { ColumnModals } from './send-page/ColumnModals'
import { ChannelSelectorSection } from './send-page/ChannelSelectorSection'
import { TemplateSelectionSection } from './send-page/TemplateSelectionSection'
import { WhatsappVariablesSection } from './send-page/WhatsappVariablesSection'
import { analyzeAttachmentPreview } from './send-page/sendPreviewUtils'
import { parseFile, headersEqual, type Row } from '../utils/fileUtils'
import { getWhatsAppConfigStatus } from '../utils/accountSettingsStorage'
import { accountSettingsService } from '../services/accountSettingsService'
import { AccountSettings } from '../types/accountSettings'

type VariableBinding = {
  mode: 'column' | 'fixed'
  column: string
  value: string
}

type SendDraft = {
  channel: 'whatsapp' | 'email' | 'none'
  message: string
  subject: string
  selectedEmailSender: string
  selectedEmailTemplateTitle: string
  selectedWhatsappSenderId: string
  selectedWhatsappTemplateTitle: string
  whatsappVariableBindings: Record<string, VariableBinding>
  phoneColumn: string
  emailColumn: string
  fileColumn: string
  matchMode: 'igual' | 'contem' | 'comeca_com' | 'termina_com'
}

const SEND_DRAFT_STORAGE_KEY = 'enviador_send_draft_v1'

function loadSendDraft(): SendDraft | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(SEND_DRAFT_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SendDraft
  } catch {
    return null
  }
}

type SendPageProps = {
  onNavigate?: (page: 'home' | 'send' | 'account' | 'contact' | 'login' | 'signup') => void
}

export default function SendPage({ onNavigate }: SendPageProps) {
  const { token } = useAuth()
  const [accountSettings, setAccountSettings] = useState<AccountSettings>(() => accountSettingsService.getCachedSettings())
  const initialDraft = React.useMemo(() => loadSendDraft(), [])

  const buildWhatsappStatus = React.useCallback((sender: {
    phoneNumber: string
    accessToken: string
    phoneNumberId: string
    businessId: string
    templates: Array<{ title: string }>
  } | null) => {
    if (!sender) {
      return getWhatsAppConfigStatus({
        phoneNumber: '',
        accessToken: '',
        phoneNumberId: '',
        businessId: ''
      })
    }

    return getWhatsAppConfigStatus({
      phoneNumber: sender.phoneNumber,
      accessToken: sender.accessToken,
      phoneNumberId: sender.phoneNumberId,
      businessId: sender.businessId
    })
  }, [])
  
  // Data state
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [rowsToSend, setRowsToSend] = useState<Row[]>([])
  
  // Channel & configuration
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'none'>('none')
  const [message, setMessage] = useState<string>('')
  const [subject, setSubject] = useState<string>('')
  const [selectedEmailSender, setSelectedEmailSender] = useState<string>(() => {
    if (initialDraft?.selectedEmailSender) return initialDraft.selectedEmailSender
    const active = accountSettings.gmailSenders.find(sender => sender.id === accountSettings.activeGmailSenderId)
    return active?.senderEmail || accountSettings.gmailSenders[0]?.senderEmail || ''
  })
  const [selectedEmailTemplateTitle, setSelectedEmailTemplateTitle] = useState<string>('')
  const [selectedWhatsappSenderId, setSelectedWhatsappSenderId] = useState<string>(initialDraft?.selectedWhatsappSenderId || '')
  const [selectedWhatsappTemplateTitle, setSelectedWhatsappTemplateTitle] = useState<string>('')
  const [whatsappVariableBindings, setWhatsappVariableBindings] = useState<Record<string, VariableBinding>>(initialDraft?.whatsappVariableBindings || {})
  
  // Attachments
  const [attachments, setAttachments] = useState<File[]>([])
  const [fileColumn, setFileColumn] = useState<string>(initialDraft?.fileColumn || '')
  const [matchMode, setMatchMode] = useState<'igual' | 'contem' | 'comeca_com' | 'termina_com'>(initialDraft?.matchMode || 'contem')
  
  // Contact columns
  const [phoneColumn, setPhoneColumn] = useState<string>(initialDraft?.phoneColumn || '')
  const [emailColumn, setEmailColumn] = useState<string>(initialDraft?.emailColumn || '')
  
  // Pagination
  const [pageSize, setPageSize] = useState<number>(20)
  const [currentPage, setCurrentPage] = useState<number>(1)
  
  // Manual create
  const [showManual, setShowManual] = useState<boolean>(false)
  const [headerInput, setHeaderInput] = useState<string>('')
  const [manualRow, setManualRow] = useState<Row>({})
  
  // Column management
  const [editingColumn, setEditingColumn] = useState<string | null>(null)
  const [newColumnName, setNewColumnName] = useState<string>('')
  const [showAddColumnModal, setShowAddColumnModal] = useState<boolean>(false)
  const [newColumnInput, setNewColumnInput] = useState<string>('')
  
  // Modals
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [errorModal, setErrorModal] = useState<{ title: string; message: string; details?: string } | null>(null)
  const [showAttachmentPreview, setShowAttachmentPreview] = useState<boolean>(false)
  const [previewWarnings, setPreviewWarnings] = useState<{
    unusedFiles: string[]
    recipientsWithoutFile: Array<{ index: number; value: string }>
    missingFilesForRecipients: Array<{ index: number; fileName: string }>
    recipientsWithMultipleAttachments: Array<{ index: number; attachments: string[]; contact: string }>
    attachmentsSentToMultiple: Array<{ fileName: string; recipients: Array<{ index: number; contact: string }> }>
    attachmentPreview: Array<{ index: number; contact: string; attachments: string[] }>
    removedDuplicateEmails: string[]
    removedDuplicateCount: number
    bulkWarning: boolean
  }>({
    unusedFiles: [],
    recipientsWithoutFile: [],
    missingFilesForRecipients: [],
    recipientsWithMultipleAttachments: [],
    attachmentsSentToMultiple: [],
    attachmentPreview: [],
    removedDuplicateEmails: [],
    removedDuplicateCount: 0,
    bulkWarning: false
  })

  // Theme mapping
  const themeMap = {
    whatsapp: { bg: 'bg-green-50', border: 'border-green-200', accent: 'text-green-600', btnClass: 'btn-success' },
    email: { bg: 'bg-red-50', border: 'border-red-200', accent: 'text-red-600', btnClass: 'btn-danger' },
    none: { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'text-blue-600', btnClass: 'btn-primary' }
  } as const
  const currentTheme = themeMap[channel]
  const activeWhatsappSender = accountSettings.whatsappSenders.find(sender => sender.id === accountSettings.activeWhatsappSenderId) || null
  const configuredWhatsappSenders = React.useMemo(
    () => accountSettings.whatsappSenders.filter(sender => buildWhatsappStatus(sender).isConfigured),
    [accountSettings.whatsappSenders, buildWhatsappStatus]
  )
  const selectedWhatsappSender = accountSettings.whatsappSenders.find(sender => sender.id === selectedWhatsappSenderId) || null
  const effectiveWhatsappSender =
    (selectedWhatsappSender && buildWhatsappStatus(selectedWhatsappSender).isConfigured ? selectedWhatsappSender : null) ||
    (activeWhatsappSender && buildWhatsappStatus(activeWhatsappSender).isConfigured ? activeWhatsappSender : null) ||
    configuredWhatsappSenders[0] ||
    selectedWhatsappSender ||
    activeWhatsappSender ||
    accountSettings.whatsappSenders[0] ||
    null
  const whatsappStatus = buildWhatsappStatus(effectiveWhatsappSender)
  const isWhatsappEnabled = configuredWhatsappSenders.length > 0
  const configuredEmailSenders = React.useMemo(
    () => accountSettings.gmailSenders.filter(sender => Boolean(sender.senderEmail.trim() && sender.appPassword.trim())),
    [accountSettings.gmailSenders]
  )
  const isEmailEnabled = configuredEmailSenders.length > 0
  const selectedEmailSenderRecord = accountSettings.gmailSenders.find(sender => sender.senderEmail === selectedEmailSender) || null
  const emailTemplates = selectedEmailSenderRecord?.templates || []
  const selectedEmailTemplate = emailTemplates.find(template => template.title === selectedEmailTemplateTitle) || null
  const whatsappTemplates = effectiveWhatsappSender?.templates || []
  const selectedWhatsappTemplate = whatsappTemplates.find(template => template.title === selectedWhatsappTemplateTitle) || null
  const whatsappTemplateVariables = React.useMemo(() => {
    if (!selectedWhatsappTemplate) return [] as string[]

    const vars = new Set<string>()
    const curlyMatches = selectedWhatsappTemplate.content.matchAll(/\{([^{}]+)\}/g)
    for (const match of curlyMatches) {
      const variable = match[1].trim()
      if (variable) vars.add(variable)
    }

    return Array.from(vars)
  }, [selectedWhatsappTemplate])

  useEffect(() => {
    if (!token) return

    let mounted = true

    accountSettingsService
      .getSettings(token)
      .then((loaded) => {
        if (!mounted) return
        setAccountSettings(loaded)
        setSelectedEmailSender(prev => prev || loaded.gmail.senderEmail)

        const activeSender = loaded.whatsappSenders.find(sender =>
          sender.phoneNumber === loaded.whatsapp.phoneNumber &&
          sender.phoneNumberId === loaded.whatsapp.phoneNumberId &&
          sender.businessId === loaded.whatsapp.businessId
        )
        setSelectedWhatsappSenderId(prev => prev || activeSender?.id || loaded.whatsappSenders[0]?.id || '')
      })
      .catch(() => {
      })

    return () => {
      mounted = false
    }
  }, [token])

  // Auto-configure contact column based on channel
  useEffect(() => {
    if (channel === 'email') {
      const emailCols = headers.filter(h => 
        h.toLowerCase().includes('email') || 
        h.toLowerCase().includes('e-mail') ||
        h.toLowerCase().includes('mail')
      )
      if (emailCols.length > 0 && !emailColumn) {
        setEmailColumn(emailCols[0])
      }
    } else if (channel === 'whatsapp') {
      const phoneCols = headers.filter(h => 
        h.toLowerCase().includes('telefone') || 
        h.toLowerCase().includes('celular') || 
        h.toLowerCase().includes('') || 
        h.toLowerCase().includes('número') || 
        h.toLowerCase().includes('phone') || 
        h.toLowerCase().includes('whatsapp') ||
        h.toLowerCase().includes('fone')
      )
      if (phoneCols.length > 0 && !phoneColumn) {
        setPhoneColumn(phoneCols[0])
      }
    }
  }, [channel, headers, emailColumn, phoneColumn])

  useEffect(() => {
    if (channel === 'email' && !isEmailEnabled) {
      setChannel('none')
      return
    }

    if (channel === 'whatsapp' && !isWhatsappEnabled) {
      setChannel('none')
    }
  }, [channel, isEmailEnabled, isWhatsappEnabled])

  useEffect(() => {
    if (!selectedEmailSender && accountSettings.gmailSenders.length > 0) {
      setSelectedEmailSender(accountSettings.gmailSenders[0].senderEmail)
      return
    }

    const senderExists = accountSettings.gmailSenders.some(sender => sender.senderEmail === selectedEmailSender)
    if (!senderExists) {
      setSelectedEmailSender(accountSettings.gmailSenders[0]?.senderEmail || '')
    }
  }, [selectedEmailSender, accountSettings.gmailSenders])

  useEffect(() => {
    const templateExists = emailTemplates.some(template => template.title === selectedEmailTemplateTitle)
    if (!templateExists && selectedEmailTemplateTitle) {
      setSelectedEmailTemplateTitle('')
    }
  }, [selectedEmailTemplateTitle, emailTemplates])

  useEffect(() => {
    if (!selectedEmailTemplate) {
      setSubject('')
      setMessage('')
      return
    }

    setSubject(selectedEmailTemplate.subject || '')
    setMessage(selectedEmailTemplate.content || '')
  }, [selectedEmailTemplate])

  useEffect(() => {
    if (channel !== 'whatsapp') return

    if (!effectiveWhatsappSender) {
      if (selectedWhatsappSenderId) setSelectedWhatsappSenderId('')
      return
    }

    const senderExists = accountSettings.whatsappSenders.some(sender => sender.id === selectedWhatsappSenderId)
    const selectedIsConfigured = Boolean(
      selectedWhatsappSender && buildWhatsappStatus(selectedWhatsappSender).isConfigured
    )

    if (!selectedWhatsappSenderId || !senderExists || !selectedIsConfigured) {
      setSelectedWhatsappSenderId(effectiveWhatsappSender.id)
    }
  }, [
    channel,
    selectedWhatsappSenderId,
    accountSettings.whatsappSenders,
    effectiveWhatsappSender,
    selectedWhatsappSender,
    buildWhatsappStatus
  ])

  useEffect(() => {
    if (channel !== 'whatsapp') return

    const templateExists = whatsappTemplates.some(template => template.title === selectedWhatsappTemplateTitle)
    if (!templateExists && selectedWhatsappTemplateTitle) {
      setSelectedWhatsappTemplateTitle('')
    }
  }, [channel, selectedWhatsappTemplateTitle, whatsappTemplates])

  useEffect(() => {
    if (channel !== 'whatsapp') return
    if (!selectedWhatsappTemplate) {
      setMessage('')
      return
    }
    setMessage(selectedWhatsappTemplate.content)
  }, [channel, selectedWhatsappTemplate])

  useEffect(() => {
    if (channel !== 'whatsapp') return

    setWhatsappVariableBindings(prev => {
      const next: Record<string, VariableBinding> = {}
      whatsappTemplateVariables.forEach(variable => {
        next[variable] = prev[variable] || { mode: 'column', column: '', value: '' }
      })
      return next
    })
  }, [channel, whatsappTemplateVariables])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const draft: SendDraft = {
      channel,
      message,
      subject,
      selectedEmailSender,
      selectedEmailTemplateTitle,
      selectedWhatsappSenderId,
      selectedWhatsappTemplateTitle,
      whatsappVariableBindings,
      phoneColumn,
      emailColumn,
      fileColumn,
      matchMode
    }

    window.localStorage.setItem(SEND_DRAFT_STORAGE_KEY, JSON.stringify(draft))
  }, [
    channel,
    message,
    subject,
    selectedEmailSender,
    selectedEmailTemplateTitle,
    selectedWhatsappSenderId,
    selectedWhatsappTemplateTitle,
    whatsappVariableBindings,
    phoneColumn,
    emailColumn,
    fileColumn,
    matchMode
  ])

  // File handling
  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    
    const fileArray = Array.from(files)
    const parsed: Array<{ name: string; heads: string[]; rows: Row[] }> = []
    
    for (const f of fileArray) {
      try {
        const p = await parseFile(f)
        parsed.push({ name: f.name, heads: p.heads, rows: p.rows })
      } catch (err: any) {
        setErrorModal({ title: 'Erro ao ler arquivo', message: `Erro ao ler ${f.name}`, details: err?.message || String(err) })
        return
      }
    }
    
    if (parsed.length === 0) return

    const firstHeads = parsed[0].heads
    const allSame = parsed.every(p => headersEqual(p.heads, firstHeads))
    
    if (!allSame) {
      setErrorModal({ title: 'Arquivos incompatíveis', message: 'Os arquivos possuem cabeçalhos diferentes. Selecione arquivos com o mesmo cabeçalho para importar juntos.' })
      return
    }

    if (headers.length > 0 && !headersEqual(headers, firstHeads)) {
      if (!confirm('Os arquivos possuem um cabeçalho diferente do cabeçalho atual. Deseja substituir o cabeçalho atual e perder os dados existentes?')) return
      setHeaders(firstHeads)
      const totalNew = parsed.flatMap(p => p.rows)
      setRows(totalNew)
      setCurrentPage(1)
      return
    }

    const prevLen = rows.length
    const combined = parsed.flatMap(p => p.rows)
    if (headers.length === 0) {
      setHeaders(firstHeads)
      setCurrentPage(1)
    }
    setRows(prev => {
      const next = [...prev, ...combined]
      const nextTotalPages = Math.max(1, Math.ceil(next.length / pageSize))
      if (prevLen === 0) {
        setCurrentPage(1)
      } else {
        setCurrentPage(nextTotalPages)
      }
      return next
    })
    alert(`Importados ${parsed.length} arquivo(s). Linhas adicionadas: ${combined.length}. Total agora: ${prevLen + combined.length}`)
  }

  function handleAttachmentFiles(files: FileList | null) {
    if (!files) return
    setAttachments(prev => {
      const existing = new Map(prev.map(f => [f.name, f]))
      Array.from(files).forEach(f => existing.set(f.name, f))
      return Array.from(existing.values())
    })
  }

  function updateCell(rIdx: number, key: string, value: string) {
    setRows(prev => prev.map((r, i) => (i === rIdx ? { ...r, [key]: value } : r)))
  }

  function addRow() {
    const empty: Row = {}
    headers.forEach(h => (empty[h] = ''))
    setRows(prev => {
      const next = [...prev, empty]
      const nextTotalPages = Math.max(1, Math.ceil(next.length / pageSize))
      setCurrentPage(nextTotalPages)
      return next
    })
  }

  function removeRow(idx: number) {
    setRows(prev => {
      const next = prev.filter((_, i) => i !== idx)
      const nextTotalPages = Math.max(1, Math.ceil(next.length / pageSize))
      if (currentPage > nextTotalPages) setCurrentPage(nextTotalPages)
      return next
    })
  }

  function addColumn(columnName: string) {
    if (!columnName.trim()) {
      alert('O nome da coluna não pode estar vazio.')
      return
    }
    if (headers.includes(columnName)) {
      alert('Uma coluna com este nome já existe.')
      return
    }
    setHeaders(prev => [...prev, columnName])
    setRows(prev => prev.map(r => ({ ...r, [columnName]: '' })))
    setNewColumnInput('')
    setShowAddColumnModal(false)
  }

  function removeColumn(columnName: string) {
    if (!confirm(`Tem certeza que deseja remover a coluna "${columnName}"? Todos os dados desta coluna serão perdidos.`)) {
      return
    }
    setHeaders(prev => prev.filter(h => h !== columnName))
    setRows(prev => prev.map(r => {
      const { [columnName]: _, ...rest } = r
      return rest
    }))
    if (phoneColumn === columnName) setPhoneColumn('')
    if (emailColumn === columnName) setEmailColumn('')
    if (fileColumn === columnName) setFileColumn('')
  }

  function renameColumn(oldName: string, newName: string) {
    if (!newName.trim()) {
      alert('O nome da coluna não pode estar vazio.')
      return
    }
    if (oldName === newName) {
      setEditingColumn(null)
      return
    }
    if (headers.includes(newName)) {
      alert('Uma coluna com este nome já existe.')
      return
    }
    setHeaders(prev => prev.map(h => h === oldName ? newName : h))
    setRows(prev => prev.map(r => {
      const { [oldName]: value, ...rest } = r
      return { ...rest, [newName]: value }
    }))
    if (phoneColumn === oldName) setPhoneColumn(newName)
    if (emailColumn === oldName) setEmailColumn(newName)
    if (fileColumn === oldName) setFileColumn(newName)
    setEditingColumn(null)
    setNewColumnName('')
  }

  function startManualCreate() {
    if (headers.length === 0) {
      setShowManual(true)
      return
    }
    const empty: Row = {}
    headers.forEach(h => (empty[h] = ''))
    setManualRow(empty)
    setShowManual(true)
  }

  function applyHeadersFromInput() {
    const parts = headerInput.split(/[,;\t|]/).map(s => s.trim()).filter(Boolean)
    if (parts.length === 0) return alert('Informe ao menos 2 cabeçalhos separados por vírgula')
    setHeaders(parts)
    setHeaderInput('')
    const empty: Row = {}
    parts.forEach(h => (empty[h] = ''))
    setManualRow(empty)
    setShowManual(true)
  }

  function handleManualChange(key: string, value: string) {
    setManualRow(prev => ({ ...prev, [key]: value }))
  }

  function addManualRow() {
    setRows(prev => {
      const next = [...prev, manualRow]
      setManualRow(headers.reduce((a, h) => ({ ...a, [h]: '' }), {}))
      const nextTotalPages = Math.max(1, Math.ceil(next.length / pageSize))
      setCurrentPage(nextTotalPages)
      return next
    })
  }

  function changePageSize(n: number) {
    setPageSize(n)
    setCurrentPage(1)
  }

  function insertPlaceholder(placeholder: string) {
    setMessage(prev => prev + ' {' + placeholder + '}')
  }

  async function handleSend() {
    if (channel === 'none') {
      setErrorModal({ title: 'Campo obrigatório', message: 'Selecione um canal antes de enviar.' })
      return
    }

    setRowsToSend([])

    if (rows.length === 0) {
      setErrorModal({ title: 'Sem dados', message: 'Nenhum destinatário carregado.' })
      return
    }
    
    const contactColumn = channel === 'whatsapp' ? phoneColumn : channel === 'email' ? emailColumn : ''

    if (channel === 'whatsapp') {
      if (!effectiveWhatsappSender) {
        setErrorModal({ title: 'Campo obrigatório', message: 'Selecione um remetente de WhatsApp para continuar.' })
        return
      }

      if (!isWhatsappEnabled) {
        setErrorModal({
          title: 'WhatsApp não habilitado',
          message: `Finalize o cadastro na aba Conta para enviar via WhatsApp. Faltando: ${whatsappStatus.missingFields.join(', ')}`
        })
        return
      }

      if (!selectedWhatsappTemplate) {
        setErrorModal({ title: 'Campo obrigatório', message: 'Selecione uma template de WhatsApp para continuar.' })
        return
      }

      const missingColumnBinding = whatsappTemplateVariables.find(variable => {
        const binding = whatsappVariableBindings[variable]
        return binding?.mode === 'column' && !binding.column
      })

      if (missingColumnBinding) {
        setErrorModal({ title: 'Variável sem vínculo', message: `Selecione uma coluna para a variável "${missingColumnBinding}" ou altere para valor fixo.` })
        return
      }
    }

    if (channel === 'email') {
      if (!isEmailEnabled) {
        setErrorModal({
          title: 'Email não habilitado',
          message: 'Finalize o cadastro de Gmail na aba Conta para enviar emails.'
        })
        return
      }

      if (!selectedEmailSender) {
        setErrorModal({ title: 'Campo obrigatório', message: 'Selecione um remetente cadastrado para envio por email.' })
        return
      }
    }
    
    if (!contactColumn) {
      setErrorModal({ title: 'Campo obrigatório', message: `Selecione a coluna de ${channel === 'whatsapp' ? 'número' : 'email'} antes de enviar.` })
      return
    }

    let filteredRows = rows
    let removedDuplicateCount = 0
    let removedDuplicateEmails: string[] = []

    if (channel === 'email') {
      const seenEmails = new Set<string>()
      const duplicates = new Set<string>()
      const uniqueRows: Row[] = []

      for (const row of rows) {
        const rawEmail = (row[contactColumn] || '').trim()
        if (!rawEmail) {
          uniqueRows.push(row)
          continue
        }

        const normalizedEmail = rawEmail.toLowerCase()
        if (seenEmails.has(normalizedEmail)) {
          removedDuplicateCount += 1
          duplicates.add(rawEmail)
          continue
        }

        seenEmails.add(normalizedEmail)
        uniqueRows.push(row)
      }

      filteredRows = uniqueRows
      removedDuplicateEmails = Array.from(duplicates)
    }
    
    const invalid = filteredRows.filter(r => !(r[contactColumn] && r[contactColumn].trim()))
    if (invalid.length > 0) {
      if (!confirm(`${invalid.length} linhas sem ${channel === 'whatsapp' ? 'número' : 'email'}. Continuar mesmo assim?`)) return
    }

    if (channel === 'email' && subject.trim().length === 0) {
      if (!confirm('Assunto vazio. Continuar sem assunto?')) return
    }

    const attachmentAnalysis = analyzeAttachmentPreview({
      rows: filteredRows,
      attachments,
      fileColumn,
      contactColumn,
      matchMode
    })

    setRowsToSend(filteredRows)

    // Sempre mostrar a prévia
    setPreviewWarnings({
      ...attachmentAnalysis,
      removedDuplicateEmails,
      removedDuplicateCount,
      bulkWarning: attachmentAnalysis.bulkWarning
    })
    setShowAttachmentPreview(true)
  }

  async function sendMessages() {
    const contactColumn = channel === 'whatsapp' ? phoneColumn : emailColumn
    
    const payload: any = {
      channel,
      message,
      rows: rowsToSend.length > 0 ? rowsToSend : rows,
      contact_column: contactColumn,
      file_column: fileColumn || null,
      attach_to_all: !fileColumn,
      match_mode: matchMode
    }

    if (channel === 'email') {
      payload.subject = subject
      payload.email_sender = selectedEmailSender
      payload.app_password = selectedEmailSenderRecord?.appPassword || ''
      payload.email_template_title = selectedEmailTemplateTitle || null
    }

    if (channel === 'whatsapp') {
      payload.whatsapp_sender_id = effectiveWhatsappSender?.id || null
      payload.phone_number = effectiveWhatsappSender?.phoneNumber || ''
      payload.whatsapp_access_token = effectiveWhatsappSender?.accessToken || ''
      payload.whatsapp_phone_number_id = effectiveWhatsappSender?.phoneNumberId || ''
      payload.whatsapp_business_id = effectiveWhatsappSender?.businessId || ''
      payload.whatsapp_template_title = selectedWhatsappTemplateTitle
      payload.whatsapp_template_variables = whatsappTemplateVariables.map(variable => {
        const binding = whatsappVariableBindings[variable] || { mode: 'fixed', column: '', value: '' }
        return {
          variable,
          mode: binding.mode,
          column: binding.mode === 'column' ? binding.column : null,
          value: binding.mode === 'fixed' ? binding.value : null
        }
      })
    }

    if (attachments.length > 0) {
      payload.attachment_names = attachments.map(f => f.name)
    }

    const form = new FormData()
    form.append('payload', JSON.stringify(payload))
    attachments.forEach(f => form.append('files', f, f.name))

    try {
      const resp = await fetch(`${config.API_BASE}/jobs/start/`, { 
        method: 'POST', 
        body: form,
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      
      if (!resp.ok) {
        const text = await resp.text()
        setErrorModal({ title: 'Erro ao iniciar envio', message: `Status ${resp.status}`, details: text })
        return
      }
      const data = await resp.json()
      setCurrentJobId(data.job_id)
    } catch (err: any) {
      setErrorModal({ title: 'Erro de conexão', message: 'Erro ao conectar com o servidor', details: err?.message || String(err) })
    }
  }

  function handleSaveList() {
    console.log('Salvar Lista - payload', { headers, rows })
    alert('Salvar Lista: configuração pendente. Veja console para payload.')
  }

  return (
    <div>
      <h2 className={`text-2xl font-semibold mb-4 ${currentTheme.accent}`}>Enviar Mensagens</h2>

      <ChannelSelectorSection
        channel={channel}
        isWhatsappEnabled={isWhatsappEnabled}
        isEmailEnabled={isEmailEnabled}
        theme={currentTheme}
        onChannelChange={setChannel}
        onNavigateToAccount={() => onNavigate?.('account')}
      />

      <FileUploadSection
        theme={currentTheme}
        onFilesSelected={handleFiles}
        onManualCreate={startManualCreate}
        onClear={() => { setHeaders([]); setRows([]); setCurrentPage(1) }}
        onSaveList={handleSaveList}
        hasData={rows.length > 0}
      />

      <ManualCreateSection
        showManual={showManual}
        headers={headers}
        headerInput={headerInput}
        manualRow={manualRow}
        theme={currentTheme}
        onHeaderInputChange={setHeaderInput}
        onApplyHeaders={applyHeadersFromInput}
        onManualRowChange={handleManualChange}
        onAddManualRow={addManualRow}
        onCancel={() => { 
          setShowManual(false) 
          setManualRow(headers.reduce((a, h) => ({ ...a, [h]: '' }), {}))
        }}
      />

      <DataTableSection
        headers={headers}
        rows={rows}
        currentPage={currentPage}
        pageSize={pageSize}
        theme={currentTheme}
        onUpdateCell={updateCell}
        onRemoveRow={removeRow}
        onAddRow={addRow}
        onAddColumn={() => setShowAddColumnModal(true)}
        onPageChange={setCurrentPage}
        onPageSizeChange={changePageSize}
        onEditColumn={(col) => {
          setEditingColumn(col)
          setNewColumnName(col)
        }}
        onRemoveColumn={removeColumn}
      />

      <ContactChannelSection
        channel={channel}
        headers={headers}
        phoneColumn={phoneColumn}
        emailColumn={emailColumn}
        showSendButton={false}
        theme={currentTheme}
        onPhoneColumnChange={setPhoneColumn}
        onEmailColumnChange={setEmailColumn}
        onSend={handleSend}
      />

      <AttachmentsSection
        attachments={attachments}
        headers={headers}
        fileColumn={fileColumn}
        matchMode={matchMode}
        theme={currentTheme}
        onAddFiles={handleAttachmentFiles}
        onRemoveFile={idx => setAttachments(prev => prev.filter((_, i) => i !== idx))}
        onClearAll={() => setAttachments([])}
        onFileColumnChange={setFileColumn}
        onMatchModeChange={setMatchMode}
      />

      <TemplateSelectionSection
        channel={channel}
        theme={currentTheme}
        gmailSenders={accountSettings.gmailSenders}
        whatsappSenders={accountSettings.whatsappSenders}
        selectedEmailSender={selectedEmailSender}
        selectedEmailTemplateTitle={selectedEmailTemplateTitle}
        selectedWhatsappSenderId={selectedWhatsappSenderId}
        selectedWhatsappTemplateTitle={selectedWhatsappTemplateTitle}
        emailTemplates={emailTemplates}
        whatsappTemplates={whatsappTemplates}
        onEmailSenderChange={(value) => {
          setSelectedEmailSender(value)
          setSelectedEmailTemplateTitle('')
        }}
        onEmailTemplateChange={setSelectedEmailTemplateTitle}
        onWhatsappSenderChange={(value) => {
          setSelectedWhatsappSenderId(value)
          setSelectedWhatsappTemplateTitle('')
          setWhatsappVariableBindings({})
        }}
        onWhatsappTemplateChange={setSelectedWhatsappTemplateTitle}
      />
      
      {channel === 'email' && (
        <div className={`mb-4 p-4 rounded ${currentTheme.bg} border ${currentTheme.border}`}>
          <h3 className="font-medium mb-2">Assunto</h3>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="input w-full"
            placeholder="Assunto do email"
          />
        </div>
      )}

      <MessageSection
        headers={headers}
        message={message}
        readOnly={channel === 'whatsapp'}
        readOnlyHint={channel === 'whatsapp' ? 'Para WhatsApp, selecione a template e configure as variáveis abaixo.' : ''}
        theme={currentTheme}
        onMessageChange={setMessage}
        onInsertPlaceholder={insertPlaceholder}
      />

      <WhatsappVariablesSection
        show={channel === 'whatsapp'}
        headers={headers}
        variables={whatsappTemplateVariables}
        bindings={whatsappVariableBindings}
        theme={currentTheme}
        selectedTemplateExists={Boolean(selectedWhatsappTemplate)}
        onBindingChange={(variable, binding) => {
          setWhatsappVariableBindings(prev => ({
            ...prev,
            [variable]: binding
          }))
        }}
      />

      

      <ContactChannelSection
        channel={channel}
        headers={headers}
        phoneColumn={phoneColumn}
        emailColumn={emailColumn}
        showColumnSelector={false}
        isSendDisabled={channel === 'none'}
        theme={currentTheme}
        onPhoneColumnChange={setPhoneColumn}
        onEmailColumnChange={setEmailColumn}
        onSend={handleSend}
      />

      <AttachmentWarningsModal
        show={showAttachmentPreview}
        warnings={previewWarnings}
        fileColumn={fileColumn}
        onContinue={() => {
          setShowAttachmentPreview(false)
          sendMessages()
        }}
        onCancel={() => setShowAttachmentPreview(false)}
      />

      <ColumnModals
        showAddModal={showAddColumnModal}
        showEditModal={editingColumn !== null}
        editingColumn={editingColumn}
        newColumnInput={newColumnInput}
        newColumnName={newColumnName}
        theme={currentTheme}
        onAddColumn={addColumn}
        onRenameColumn={renameColumn}
        onNewColumnInputChange={setNewColumnInput}
        onNewColumnNameChange={setNewColumnName}
        onCancelAdd={() => {
          setShowAddColumnModal(false)
          setNewColumnInput('')
        }}
        onCancelEdit={() => {
          setEditingColumn(null)
          setNewColumnName('')
        }}
      />

      {currentJobId && (
        <SendProgressModal jobId={currentJobId} token={token} onClose={() => setCurrentJobId(null)} />
      )}

      {errorModal && (
        <ErrorModal
          title={errorModal.title}
          message={errorModal.message}
          details={errorModal.details}
          onClose={() => setErrorModal(null)}
        />
      )}
    </div>
  )
}
