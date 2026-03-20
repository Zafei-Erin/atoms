import { ArrowRightIcon } from '../../../icons'

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
}

export function PromptInput({ value, onChange }: PromptInputProps) {
  const disabled = !value.trim()

  return (
    <div
      className="w-full bg-white rounded-2xl"
      style={{ border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '16px 16px 12px 16px' }}
    >
      <div className="relative" style={{ minHeight: '100px' }}>
        <textarea
          className="w-full resize-none outline-none text-sm text-gray-800 bg-transparent leading-relaxed relative z-10"
          style={{ minHeight: '100px', border: 'none', fontFamily: 'inherit', padding: 0 }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {!value && (
          <div
            className="absolute inset-0 text-sm leading-relaxed pointer-events-none select-none"
            style={{ color: '#c4c4c4' }}
          >
            Build an internal dashboard to manage my business data…
          </div>
        )}
      </div>

      <div className="flex justify-end mt-3">
        <button
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-full cursor-pointer transition-colors"
          style={{
            padding: '7px 18px',
            fontSize: '13.5px',
            fontWeight: 500,
            border: 'none',
            color: 'white',
            background: disabled ? '#a5b4fc' : '#4f46e5',
            cursor: disabled ? 'default' : 'pointer',
          }}
          onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = '#4338ca' }}
          onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = '#4f46e5' }}
        >
          Start for free
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  )
}
