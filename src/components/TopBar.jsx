// TopBar — PureTrack-style thin header strip
import { buildShareUrl } from '../utils/api'

const styles = {
  bar: {
    position: 'fixed', top: 0, left: 0, right: 0,
    height: '44px', zIndex: 900,
    background: 'rgba(7,11,18,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex', alignItems: 'center',
    padding: '0 12px', gap: '10px',
  },
  logo: {
    fontFamily: 'var(--font-ui)', fontWeight: 900,
    fontSize: '18px', letterSpacing: '3px',
    color: 'var(--cyan)', textTransform: 'uppercase',
    display: 'flex', alignItems: 'center', gap: '2px',
    userSelect: 'none', cursor: 'default',
  },
  logoSpan: { color: 'var(--amber)' },
  divider: {
    width: '1px', height: '20px',
    background: 'var(--border-default)',
  },
  subtitle: {
    fontFamily: 'var(--font-mono)', fontSize: '9px',
    color: 'var(--text-muted)', letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  spacer: { flex: 1 },
  statusDot: {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontFamily: 'var(--font-mono)', fontSize: '10px',
    color: 'var(--text-secondary)',
  },
  dot: (color) => ({
    width: '6px', height: '6px', borderRadius: '50%',
    background: color, boxShadow: `0 0 6px ${color}`,
    animation: 'blinkDot 2s ease-in-out infinite',
  }),
  btn: {
    height: '28px', padding: '0 10px',
    borderRadius: '5px',
    border: '1px solid var(--border-default)',
    background: 'var(--surface-1)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)', fontSize: '12px', fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: '5px',
    transition: 'all 0.15s',
    letterSpacing: '0.3px',
    whiteSpace: 'nowrap',
  },
  coordBadge: {
    fontFamily: 'var(--font-mono)', fontSize: '9px',
    color: 'var(--text-muted)', letterSpacing: '0.5px',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid var(--border-subtle)',
    background: 'rgba(0,0,0,0.2)',
    display: 'none',
  }
}

export default function TopBar({ from, to, onShareClick, onSidebarToggle, sidebarOpen }) {
  const handleShare = async () => {
    const url = buildShareUrl(from, to)
    if (navigator.share) {
      try {
        await navigator.share({ title: 'HOMERUN — My Landing', text: `From: ${from?.name || '?'}`, url })
      } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      onShareClick?.('copied')
    }
  }

  return (
    <div style={styles.bar}>
      {/* Hamburger / sidebar toggle */}
      <button
        onClick={onSidebarToggle}
        style={{
          ...styles.btn,
          width: '28px', padding: 0, justifyContent: 'center',
          borderColor: sidebarOpen ? 'var(--border-strong)' : undefined,
          color: sidebarOpen ? 'var(--cyan)' : undefined,
        }}
        title="Toggle panel"
      >
        <svg width="12" height="10" viewBox="0 0 12 10" fill="currentColor">
          <rect width="12" height="1.5" rx="0.75"/>
          <rect y="4" width="8" height="1.5" rx="0.75"/>
          <rect y="8" width="12" height="1.5" rx="0.75"/>
        </svg>
      </button>

      <div style={styles.logo}>
        HOM<span style={styles.logoSpan}>E</span>RUN
      </div>

      <div style={styles.divider}/>

      <div style={styles.subtitle}>
        TRANSIT NAV
      </div>

      {from && (
        <>
          <div style={styles.divider}/>
          <div style={styles.statusDot}>
            <div style={styles.dot('var(--green)')}/>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 600 }}>
              LOCATED
            </span>
          </div>
        </>
      )}

      {from && to && (
        <>
          <div style={styles.divider}/>
          <div style={styles.statusDot}>
            <div style={styles.dot('var(--amber)')}/>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 600 }}>
              ROUTE SET
            </span>
          </div>
        </>
      )}

      <div style={styles.spacer}/>

      {from && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '9px',
          color: 'var(--text-muted)', letterSpacing: '0.5px',
        }}>
          {from.lat.toFixed(4)}°,{from.lon.toFixed(4)}°
        </div>
      )}

      <button
        onClick={handleShare}
        style={styles.btn}
        title="Share this location"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Share
      </button>
    </div>
  )
}
