import { Row } from './fileUtils'

export type MatchMode = 'igual' | 'contem' | 'comeca_com' | 'termina_com'

export type AttachmentPreviewResult = {
  unusedFiles: string[]
  recipientsWithoutFile: Array<{ index: number; value: string }>
  missingFilesForRecipients: Array<{ index: number; fileName: string }>
  recipientsWithMultipleAttachments: Array<{ index: number; attachments: string[]; contact: string }>
  attachmentsSentToMultiple: Array<{ fileName: string; recipients: Array<{ index: number; contact: string }> }>
  attachmentPreview: Array<{ index: number; contact: string; attachments: string[] }>
  bulkWarning: boolean
}

type AnalyzeArgs = {
  rows: Row[]
  attachments: File[]
  fileColumn: string
  contactColumn: string
  matchMode: MatchMode
}

function normalizeAttachmentName(name: string): string {
  if (!name) return ''

  let value = String(name).trim()
  value = value.replace(/^[\s\-→>»•]+/, '')
  value = value.trim()
  value = value.replace(/\.(jpg|jpeg|png|gif|pdf|docx|doc|xlsx|xls|zip|txt)$/i, '')

  return value.toLowerCase()
}

function matchesAttachment(fileNameValue: string, fileName: string, matchMode: MatchMode): boolean {
  const normalizedValue = normalizeAttachmentName(fileNameValue)
  const normalizedFile = normalizeAttachmentName(fileName)

  switch (matchMode) {
    case 'igual':
      return normalizedValue === normalizedFile
    case 'comeca_com':
      return normalizedFile.startsWith(normalizedValue)
    case 'termina_com':
      return normalizedFile.endsWith(normalizedValue)
    case 'contem':
    default:
      return normalizedFile.includes(normalizedValue)
  }
}

export function analyzeAttachmentPreview({
  rows,
  attachments,
  fileColumn,
  contactColumn,
  matchMode
}: AnalyzeArgs): AttachmentPreviewResult {
  let unusedFiles: string[] = []
  const recipientsWithoutFile: Array<{ index: number; value: string }> = []
  const missingFilesForRecipients: Array<{ index: number; fileName: string }> = []
  let recipientsWithMultipleAttachments: Array<{ index: number; attachments: string[]; contact: string }> = []
  let attachmentsSentToMultiple: Array<{ fileName: string; recipients: Array<{ index: number; contact: string }> }> = []
  let attachmentPreview: Array<{ index: number; contact: string; attachments: string[] }> = []
  let bulkWarning = false

  if (fileColumn) {
    const filesReferencedSet = new Set<string>()
    const recipientAttachments: Map<number, string[]> = new Map()
    const attachmentRecipients: Map<string, Array<{ index: number; contact: string }>> = new Map()

    rows.forEach((row, index) => {
      const fileNameValue = (row[fileColumn] || '').trim()
      const contact = row[contactColumn] || `Linha ${index + 1}`

      if (!fileNameValue) {
        recipientsWithoutFile.push({ index, value: contact })
        attachmentPreview.push({ index, contact, attachments: [] })
        return
      }

      const matchedFiles = attachments.filter(file => matchesAttachment(fileNameValue, file.name, matchMode))

      recipientAttachments.set(index, matchedFiles.map(file => file.name))
      attachmentPreview.push({ index, contact, attachments: matchedFiles.map(file => file.name) })

      if (matchedFiles.length === 0) {
        missingFilesForRecipients.push({ index, fileName: fileNameValue })
      } else {
        matchedFiles.forEach(file => {
          filesReferencedSet.add(normalizeAttachmentName(file.name))
          if (!attachmentRecipients.has(file.name)) {
            attachmentRecipients.set(file.name, [])
          }
          attachmentRecipients.get(file.name)?.push({ index, contact })
        })
      }
    })

    unusedFiles = attachments
      .map(file => file.name)
      .filter(name => !filesReferencedSet.has(normalizeAttachmentName(name)))

    recipientsWithMultipleAttachments = Array.from(recipientAttachments.entries())
      .filter(([, items]) => items.length > 1)
      .map(([index, items]) => ({
        index,
        attachments: items,
        contact: rows[index][contactColumn] || `Linha ${index + 1}`
      }))

    attachmentsSentToMultiple = Array.from(attachmentRecipients.entries())
      .filter(([, recipients]) => recipients.length > 1)
      .map(([fileName, recipients]) => ({ fileName, recipients }))
  } else {
    attachmentPreview = rows.map((row, index) => ({
      index,
      contact: row[contactColumn] || `Linha ${index + 1}`,
      attachments: attachments.map(file => file.name)
    }))
    bulkWarning = attachments.length > 1 && rows.length > 10
  }

  return {
    unusedFiles,
    recipientsWithoutFile,
    missingFilesForRecipients,
    recipientsWithMultipleAttachments,
    attachmentsSentToMultiple,
    attachmentPreview,
    bulkWarning
  }
}
