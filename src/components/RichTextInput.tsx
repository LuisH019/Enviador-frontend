import React from 'react'

type RichTextInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  minHeightClassName?: string
}

export default function RichTextInput({
  value,
  onChange,
  placeholder = '',
  readOnly = false,
  minHeightClassName = 'min-h-[96px]'
}: RichTextInputProps) {
  const editorRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    if (editor.innerHTML !== value) {
      editor.innerHTML = value || ''
    }
  }, [value])

  return (
    <div className="relative">
      {!value && placeholder && (
        <div className="absolute left-3 top-2 text-sm text-slate-400 pointer-events-none select-none">
          {placeholder}
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className={`input w-full ${minHeightClassName} py-2 overflow-auto whitespace-pre-wrap ${readOnly ? 'opacity-80 cursor-not-allowed' : ''}`}
      />
    </div>
  )
}
