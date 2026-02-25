// SharePanel — full share / export slide-up
import { buildShareUrl } from '../utils/api'

function LinkBtn({ icon, label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: '46px', width: '100%', borderRadius: '8px',
        border: '1px solid var(--border-default)',
        background: 'var(--surface-2)',
        color: color || 'var(--text-primary)',
        cursor: 'pointer', fontFamily: 'var(--font-ui)',
        fontSize: '14px', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0 14px', transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-strong)'
        e.currentTarget.style.background = 'var(--surface-3)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-default)'
        e.currentTarget.style.background = 'var(--surface-2)'
      }}
    >
      <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  )
}

export default function SharePanel({ from, to, onClose, showToast }) {
  const url = buildShareUrl(from, to)

  const copy = async () => {
    await navigator.clipboard?.writeText(url)
    showToast?.('🔗 URL copied to clipboard')
  }

  const copyCoords = async () => {
    if (!from) return
    await navigator.clipboard?.writeText(`${from.lat.toFixed(6)}, ${from.lon.toFixed(6)}`)
    showToast?.('📍 Coordinates copied')
  }

  const openGMaps = () => {
    if (!from || !to) return
    window.open(`https://www.google.com/maps/dir/${from.lat},${from.lon}/${to.lat},${to.lon}`, '_blank')
  }

  const openCitymapper = () => {
    if (!from || !to) return
    window.open(`https://citymapper.com/directions?startcoord=${from.lat},${from.lon}&endcoord=${to.lat},${to.lon}`, '_blank')
  }

  const openSMS = () => {
    if (!from) return
    const text = encodeURIComponent(`I've landed at: ${from.name}\n${url}`)
    window.open(`sms:?body=${text}`)
  }

  const nativeShare = () => {
    navigator.share?.({ title: 'HOMERUN — My Landing', url })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 850,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', zIndex: 860,
        bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: 'min(440px, 100vw)',
        background: 'var(--surface-1)',
        borderTop: '1px solid var(--border-default)',
        borderRadius: '16px 16px 0 0',
        padding: '16px 18px 28px',
        boxShadow: '0 -12px 50px rgba(0,0,0,0.7)',
        animation: 'fadeUp 0.2s ease',
      }}>
        {/* Handle */}
        <div style={{
          width: '32px', height: '3px', borderRadius: '2px',
          background: 'var(--border-default)', margin: '0 auto 16px',
        }}/>

        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: '17px', fontWeight: 800,
          letterSpacing: '0.5px', marginBottom: '14px',
        }}>📤 Share Journey</div>

        {/* URL box */}
        <div
          onClick={copy}
          title="Click to copy"
          style={{
            background: 'var(--surface-0)', border: '1px solid var(--border-default)',
            borderRadius: '7px', padding: '10px 12px',
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            color: 'var(--text-secondary)', wordBreak: 'break-all',
            cursor: 'pointer', marginBottom: '12px', lineHeight: 1.5,
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
        >
          {url}
          <span style={{ color: 'var(--cyan)', marginLeft: '6px' }}>⎘ copy</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px' }}>
          {from && to && (
            <>
              <LinkBtn icon="🗺️" label="Open in Google Maps" onClick={openGMaps}/>
              <LinkBtn icon="🚇" label="Open in Citymapper" onClick={openCitymapper}/>
            </>
          )}
          <LinkBtn icon="📍" label="Copy coordinates" onClick={copyCoords}/>
          <LinkBtn icon="💬" label="Send via SMS" onClick={openSMS}/>
          {navigator.share && (
            <LinkBtn icon="📲" label="Share via device" onClick={nativeShare} color="var(--cyan)"/>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', height: '42px', borderRadius: '8px',
            border: '1px solid var(--border-default)',
            background: 'transparent', color: 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: 'var(--font-ui)',
            fontSize: '14px', fontWeight: 600,
            transition: 'all 0.15s',
          }}
        >Close</button>
      </div>
    </>
  )
}
