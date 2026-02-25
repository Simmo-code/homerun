// ToastStack — stacked notification toasts
export default function ToastStack({ toasts }) {
  if (!toasts.length) return null

  const typeColors = {
    info:    'var(--text-primary)',
    success: 'var(--green)',
    error:   'var(--red)',
    warn:    'var(--amber)',
  }

  return (
    <div style={{
      position: 'fixed', zIndex: 9999,
      bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column-reverse', gap: '6px',
      pointerEvents: 'none', alignItems: 'center',
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            background: 'rgba(13,21,37,0.96)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
            padding: '9px 16px',
            fontFamily: 'var(--font-ui)', fontSize: '13px', fontWeight: 600,
            color: typeColors[toast.type] || typeColors.info,
            whiteSpace: 'nowrap',
            boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
            animation: 'toastIn 0.2s ease, toastOut 0.2s ease 2.4s forwards',
            letterSpacing: '0.2px',
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
