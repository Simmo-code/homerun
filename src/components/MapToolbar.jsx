// MapToolbar — right-side floating toolbar (PureTrack-style)
// Buttons: centre on me, layers, share, SOS

const btnStyle = (active) => ({
  width: '36px', height: '36px', borderRadius: '7px',
  background: active ? 'rgba(0,229,255,0.12)' : 'rgba(7,11,18,0.9)',
  border: `1px solid ${active ? 'rgba(0,229,255,0.35)' : 'rgba(0,180,220,0.14)'}`,
  color: active ? 'var(--cyan)' : '#6b8299',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(8px)',
  transition: 'all 0.15s',
  flexShrink: 0,
})

function ToolBtn({ icon, title, onClick, active, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        ...btnStyle(active),
        color: danger ? 'var(--red)' : active ? 'var(--cyan)' : '#6b8299',
        borderColor: danger ? 'rgba(255,61,61,0.3)' : active ? 'rgba(0,229,255,0.35)' : 'rgba(0,180,220,0.14)',
        background: danger ? 'rgba(255,61,61,0.08)' : active ? 'rgba(0,229,255,0.12)' : 'rgba(7,11,18,0.9)',
      }}
      onMouseEnter={e => {
        if (!danger) e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'
        e.currentTarget.style.color = danger ? '#ff6b6b' : 'var(--cyan)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = danger ? 'rgba(255,61,61,0.3)' : active ? 'rgba(0,229,255,0.35)' : 'rgba(0,180,220,0.14)'
        e.currentTarget.style.color = danger ? 'var(--red)' : active ? 'var(--cyan)' : '#6b8299'
      }}
    >
      <span style={{ fontSize: '15px', lineHeight: 1 }}>{icon}</span>
    </button>
  )
}

export default function MapToolbar({ onCentreMe, onSharePanel, onSOS, sidebarOpen }) {
  return (
    <div style={{
      position: 'fixed',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 700,
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      alignItems: 'center',
    }}>
      <ToolBtn icon="◎" title="Centre on my location" onClick={onCentreMe}/>

      <div style={{ width: '20px', height: '1px', background: 'rgba(0,180,220,0.14)' }}/>

      <ToolBtn icon="↗" title="Share journey / export" onClick={onSharePanel}/>

      <div style={{ width: '20px', height: '1px', background: 'rgba(0,180,220,0.14)' }}/>

      <ToolBtn icon="🆘" title="Emergency: share location" onClick={onSOS} danger/>
    </div>
  )
}
