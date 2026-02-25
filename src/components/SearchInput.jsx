// SearchInput — Geocoding autocomplete field
import { useState, useEffect, useRef } from 'react'
import { geocodeSearch } from '../utils/api'

export default function SearchInput({ value, onChange, onClear, placeholder, accentColor, label }) {
  const [query,    setQuery]   = useState(value?.name || '')
  const [results,  setResults] = useState([])
  const [open,     setOpen]    = useState(false)
  const [focused,  setFocused] = useState(false)
  const timerRef = useRef(null)
  const wrapRef  = useRef(null)

  useEffect(() => { setQuery(value?.name || '') }, [value])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = (e) => {
    const q = e.target.value
    setQuery(q)
    if (!q.trim()) { setResults([]); setOpen(false); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await geocodeSearch(q)
        setResults(res)
        setOpen(true)
      } catch {}
    }, 420)
  }

  const handleSelect = (item) => {
    const loc = {
      lat:  parseFloat(item.lat),
      lon:  parseFloat(item.lon),
      name: item.display_name.split(',').slice(0, 2).join(', ').trim(),
    }
    setQuery(loc.name)
    setResults([])
    setOpen(false)
    onChange(loc)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
    onClear?.()
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '0 12px', height: '44px',
        borderBottom: `1px solid var(--border-subtle)`,
        background: focused ? 'rgba(0,229,255,0.025)' : 'transparent',
        transition: 'background 0.15s',
      }}>
        {/* Dot indicator */}
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: accentColor,
          boxShadow: `0 0 8px ${accentColor}`,
          flexShrink: 0,
        }}/>

        {/* Label */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '8px',
          color: 'var(--text-muted)', letterSpacing: '1.5px',
          textTransform: 'uppercase', flexShrink: 0, width: '24px',
        }}>{label}</div>

        {/* Input */}
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-ui)', fontSize: '14px', fontWeight: 600,
            padding: 0, minWidth: 0,
          }}
        />

        {/* Clear */}
        {query && (
          <button
            onClick={handleClear}
            style={{
              width: '18px', height: '18px', borderRadius: '50%',
              background: 'var(--surface-3)', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '11px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, lineHeight: 1,
            }}
          >×</button>
        )}
      </div>

      {/* Autocomplete */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 600,
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          animation: 'fadeUp 0.12s ease',
        }}>
          {results.map((r, i) => {
            const parts  = r.display_name.split(',')
            const name   = parts.slice(0, 2).join(', ')
            const detail = parts.slice(2, 5).join(',').trim()
            return (
              <div
                key={i}
                onMouseDown={() => handleSelect(r)}
                style={{
                  padding: '9px 12px', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ color: accentColor, fontSize: '12px', marginTop: '2px', flexShrink: 0 }}>◉</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{name}</div>
                  {detail && <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>{detail}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
