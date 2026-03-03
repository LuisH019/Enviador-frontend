import React from 'react'

interface PreviewWarnings {
  unusedFiles: string[]
  recipientsWithoutFile: Array<{ index: number; value: string }>
  missingFilesForRecipients: Array<{ index: number; fileName: string }>
  recipientsWithMultipleAttachments: Array<{ index: number; attachments: string[]; contact: string }>
  attachmentsSentToMultiple: Array<{ fileName: string; recipients: Array<{ index: number; contact: string }> }>
  attachmentPreview: Array<{ index: number; contact: string; attachments: string[] }>
  bulkWarning: boolean
}

interface Props {
  show: boolean
  warnings: PreviewWarnings
  fileColumn: string
  onContinue: () => void
  onCancel: () => void
}

export function AttachmentWarningsModal({ show, warnings, fileColumn, onContinue, onCancel }: Props) {
  if (!show) return null

  const hasSummaryItems =
    warnings.unusedFiles.length > 0 ||
    warnings.recipientsWithoutFile.length > 0 ||
    warnings.missingFilesForRecipients.length > 0 ||
    warnings.recipientsWithMultipleAttachments.length > 0 ||
    warnings.attachmentsSentToMultiple.length > 0 ||
    warnings.bulkWarning

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="text-2xl font-bold">Prévia de Envio de Mensagens</h3>
        </div>

        <div className="space-y-4">
          {/* Arquivos não utilizados */}
          {warnings.unusedFiles.length > 0 && (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <div className="flex items-center gap-2 mb-3">
                <div className="font-bold text-yellow-900">
                  Arquivos não utilizados ({warnings.unusedFiles.length})
                </div>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                Os seguintes arquivos não combinam com nenhuma linha no mapeamento e <span className="font-semibold">NÃO serão enviados</span>:
              </p>
              <div className="bg-white rounded p-3 max-h-40 overflow-y-auto">
                <ul className="space-y-2">
                  {warnings.unusedFiles.map((file, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-yellow-800">
                      <span className="text-yellow-600 mt-0.5">→</span>
                      <span>{file}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Destinatários sem arquivo */}
          {warnings.recipientsWithoutFile.length > 0 && (
            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
              <div className="flex items-center gap-2 mb-3">
                <div className="font-bold text-blue-900">
                  Destinatários sem arquivo ({warnings.recipientsWithoutFile.length})
                </div>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Os seguintes destinatários não têm nenhum arquivo especificado na coluna "{fileColumn}":
              </p>
              <div className="bg-white rounded p-3 max-h-40 overflow-y-auto">
                <ul className="space-y-2">
                  {warnings.recipientsWithoutFile.slice(0, 10).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                      <span className="text-blue-600 mt-0.5">→</span>
                      <span>
                        <span className="font-medium">Linha {item.index + 1}</span>
                        {item.value && <span> ({item.value})</span>}
                      </span>
                    </li>
                  ))}
                  {warnings.recipientsWithoutFile.length > 10 && (
                    <li className="text-sm text-blue-600 italic">
                      ... e mais {warnings.recipientsWithoutFile.length - 10}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Arquivos faltando para recipientes */}
          {warnings.missingFilesForRecipients.length > 0 && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded">
              <div className="flex items-center gap-2 mb-3">
                <div className="font-bold text-red-900">
                  Arquivo(s) não encontrado(s) ({warnings.missingFilesForRecipients.length})
                </div>
              </div>
              <p className="text-sm text-red-700 mb-3">
                Os seguintes destinatários referenciam arquivos que não foram anexados:
              </p>
              <div className="bg-white rounded p-3 max-h-40 overflow-y-auto">
                <ul className="space-y-2">
                  {warnings.missingFilesForRecipients.slice(0, 10).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                      <span className="text-red-600 mt-0.5">→</span>
                      <span>
                        <span className="font-medium">Linha {item.index + 1}</span>
                        <span className="text-red-600"> requer "{item.fileName}"</span>
                      </span>
                    </li>
                  ))}
                  {warnings.missingFilesForRecipients.length > 10 && (
                    <li className="text-sm text-red-600 italic">
                      ... e mais {warnings.missingFilesForRecipients.length - 10}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Destinatários com múltiplos anexos */}
          {warnings.recipientsWithMultipleAttachments.length > 0 && (
            <div className="p-4 bg-purple-50 border-l-4 border-purple-400 rounded">
              <div className="flex items-center gap-2 mb-3">
                <div className="font-bold text-purple-900">
                  Destinatários com múltiplos anexos ({warnings.recipientsWithMultipleAttachments.length})
                </div>
              </div>
              <p className="text-sm text-purple-700 mb-3">
                Os seguintes destinatários receberão mais de um anexo:
              </p>
              <div className="bg-white rounded p-3 max-h-40 overflow-y-auto">
                <ul className="space-y-2">
                  {warnings.recipientsWithMultipleAttachments.slice(0, 10).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-purple-800">
                      <span className="text-purple-600 mt-0.5">→</span>
                      <span>
                        <span className="font-medium">{item.contact}</span>
                        <span className="text-purple-600"> ({item.attachments.length} anexos: {item.attachments.join(', ')})</span>
                      </span>
                    </li>
                  ))}
                  {warnings.recipientsWithMultipleAttachments.length > 10 && (
                    <li className="text-sm text-purple-600 italic">
                      ... e mais {warnings.recipientsWithMultipleAttachments.length - 10}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Anexos enviados para múltiplos destinatários */}
          {warnings.attachmentsSentToMultiple.length > 0 && (
            <div className="p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded">
              <div className="flex items-center gap-2 mb-3">
                <div className="font-bold text-indigo-900">
                  Anexos compartilhados ({warnings.attachmentsSentToMultiple.length})
                </div>
              </div>
              <p className="text-sm text-indigo-700 mb-3">
                Os seguintes anexos serão enviados para mais de um destinatário:
              </p>
              <div className="bg-white rounded p-3 max-h-40 overflow-y-auto">
                <ul className="space-y-2">
                  {warnings.attachmentsSentToMultiple.slice(0, 10).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-indigo-800">
                      <span className="text-indigo-600 mt-0.5">→</span>
                      <span>
                        <span className="font-medium">{item.fileName}</span>
                        <span className="text-indigo-600"> para {item.recipients.length} destinatários</span>
                      </span>
                    </li>
                  ))}
                  {warnings.attachmentsSentToMultiple.length > 10 && (
                    <li className="text-sm text-indigo-600 italic">
                      ... e mais {warnings.attachmentsSentToMultiple.length - 10}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Aviso para envio em massa */}
          {warnings.bulkWarning && (
            <div className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded">
              <div className="flex items-center gap-2 mb-3">
                <div className="font-bold text-orange-900">
                  Envio em massa detectado
                </div>
              </div>
              <p className="text-sm text-orange-700">
                Você está enviando {warnings.attachmentPreview[0]?.attachments.length || 0} anexo(s) para {warnings.attachmentPreview.length} destinatários.
                Isso pode resultar em um grande volume de dados. Certifique-se de que é isso que deseja.
              </p>
            </div>
          )}

          {/* Prévia de anexos */}
          <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded">
            <div className="flex items-center gap-2 mb-3">
              <div className="font-bold text-green-900">
                Prévia de envio ({warnings.attachmentPreview.length} destinatários)
              </div>
            </div>
            <p className="text-sm text-green-700 mb-3">
              Veja o que será enviado para cada destinatário:
            </p>
            <div className="bg-white rounded p-3 max-h-60 overflow-y-auto">
              <ul className="space-y-2">
                {warnings.attachmentPreview.slice(0, 20).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                    <span className="text-green-600 mt-0.5">→</span>
                    <span>
                      <span className="font-medium">{item.contact}</span>
                      {item.attachments.length > 0 && (
                        <span className="text-green-600"> ({item.attachments.length} anexo{item.attachments.length !== 1 ? 's' : ''}: {item.attachments.join(', ')})</span>
                      )}
                    </span>
                  </li>
                ))}
                {warnings.attachmentPreview.length > 20 && (
                  <li className="text-sm text-green-600 italic">
                    ... e mais {warnings.attachmentPreview.length - 20} destinatários
                  </li>
                )}
              </ul>
            </div>
          </div>

        </div>

        {/* Resumo */}
        {hasSummaryItems && (
          <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
            <div className="font-semibold text-gray-900 mb-2">Resumo:</div>
            <div className="text-sm text-gray-700 space-y-1">
              {warnings.unusedFiles.length > 0 && (
                <div>• {warnings.unusedFiles.length} arquivo(s) não será(ão) enviado(s)</div>
              )}
              {warnings.recipientsWithoutFile.length > 0 && (
                <div>• {warnings.recipientsWithoutFile.length} destinatário(s) sem anexo</div>
              )}
              {warnings.missingFilesForRecipients.length > 0 && (
                <div>• {warnings.missingFilesForRecipients.length} destinatário(s) com arquivo(s) faltando</div>
              )}
              {warnings.recipientsWithMultipleAttachments.length > 0 && (
                <div>• {warnings.recipientsWithMultipleAttachments.length} destinatário(s) com múltiplos anexos</div>
              )}
              {warnings.attachmentsSentToMultiple.length > 0 && (
                <div>• {warnings.attachmentsSentToMultiple.length} anexo(s) compartilhado(s)</div>
              )}
              {warnings.bulkWarning && (
                <div>• Envio em massa: {warnings.attachmentPreview[0]?.attachments.length || 0} anexo(s) para {warnings.attachmentPreview.length} destinatários</div>
              )}
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onContinue}
            className="flex-1 btn bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            ✓ Confirmar e Enviar
          </button>
          <button
            onClick={onCancel}
            className="flex-1 btn bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold"
          >
            ✕ Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
