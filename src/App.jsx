// App.jsx — HOMERUN main application
// PureTrack-style map-first layout with collapsible sidebar
import { useState, useEffect, useRef, useCallback } from 'react'
import TopBar      from './components/TopBar'
import Sidebar     from './components/Sidebar'
import MapToolbar  from './components/MapToolbar'
import SharePanel  from './components/SharePanel'
import ToastStack  from './components/ToastStack'
import { useMap }  from './hooks/useMap'
import { useToast } from './hooks/useToast'
import {
  reverseGeocode, fetchOSRM, fetchTransitous, fetchNearby,
  buildRoutes, parseUrlParams,
} from './utils/api'

const SIDEBAR_WIDTH = 340

export default function App() {
  // ── Core state ─────────────────────────────────
  const [from,           setFrom]          = useState(null)
  const [to,             setTo]            = useState(null)
  const [routes,         setRoutes]        = useState([])
  const [activeRouteIdx, setActiveRouteIdx]= useState(0)
  const [loading,        setLoading]       = useState(false)
  const [nearbyStops,    setNearbyStops]   = useState({ bus: [], train: [], bike: [], taxi: [] })
  const [sidebarOpen,    setSidebarOpen]   = useState(true)
  const [showShare,      setShowShare]     = useState(false)
  const [home,           setHome]          = useState(() => {
    try { return JSON.parse(localStorage.getItem('homerun_home') || 'null') } catch { return null }
  })

  const { toasts, showToast } = useToast()
  const mapContainerRef       = useRef(null)

  const {
    setFromMarker, setToMarker, setHomeMarker, drawRoutes,
    drawNearbyStops, flyToBounds, flyTo, setYouAreHere,
  } = useMap(mapContainerRef)

  // ── Load URL params on mount ──────────────────
  useEffect(() => {
    const { from: urlFrom, to: urlTo } = parseUrlParams()
    if (urlFrom) setFrom(urlFrom)
    if (urlTo)   setTo(urlTo)
    if (urlFrom && urlTo) showToast('🔗 Route loaded from shared link')
  }, [])

  // ── Auto-load home into 'to' if not set ───────
  useEffect(() => {
    if (home && !to) setTo(home)
  }, [])

  // ── Sync from marker + nearby ─────────────────
  useEffect(() => {
    setFromMarker(from)
    if (from) {
      setYouAreHere(from.lat, from.lon)
      loadNearby(from.lat, from.lon)
    }
    if (from && to) flyToBounds(from, to)
    else if (from)  flyTo(from.lat, from.lon, 14)
  }, [from])

  // ── Sync to marker ────────────────────────────
  useEffect(() => {
    setToMarker(to)
    if (from && to) flyToBounds(from, to)
  }, [to])

  // ── Sync home marker ──────────────────────────
  useEffect(() => {
    setHomeMarker(home)
  }, [home])

  // ── Re-draw routes on active change ──────────
  useEffect(() => {
    drawRoutes(routes, activeRouteIdx)
  }, [routes, activeRouteIdx])

  // ── Sync nearby markers ───────────────────────
  useEffect(() => {
    drawNearbyStops(nearbyStops, handleNearbyStopClick)
  }, [nearbyStops])

  // ── Get GPS location ──────────────────────────
  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('❌ GPS not available on this device', 'error')
      return
    }
    showToast('📡 Acquiring GPS signal…')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        try {
          const data = await reverseGeocode(lat, lon)
          const name = data.display_name
            ? data.display_name.split(',').slice(0, 3).join(',').trim()
            : `${lat.toFixed(5)}, ${lon.toFixed(5)}`
          setFrom({ lat, lon, name })
          showToast('📍 Location acquired', 'success')
        } catch {
          setFrom({ lat, lon, name: `${lat.toFixed(5)}, ${lon.toFixed(5)}` })
          showToast('📍 Location set (no address found)', 'warn')
        }
      },
      (err) => {
        const msg = {
          1: '❌ Location access denied — check browser permissions',
          2: '❌ Location unavailable',
          3: '❌ GPS timed out — try again',
        }[err.code] || '❌ Could not get location'
        showToast(msg, 'error')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }, [showToast])

  // ── Load nearby transport ─────────────────────
  const loadNearby = useCallback(async (lat, lon) => {
    try {
      const stops = await fetchNearby(lat, lon)
      setNearbyStops(stops)
      const total = Object.values(stops).flat().length
      if (total > 0) showToast(`🔎 Found ${total} nearby transport options`)
    } catch {
      // Silent fail — nearby is non-critical
    }
  }, [showToast])

  // ── Get routes ────────────────────────────────
  const handleGetRoutes = useCallback(async () => {
    if (!from || !to) return
    setLoading(true)
    setRoutes([])
    setActiveRouteIdx(0)
    showToast('🔍 Scanning transport networks…')

    try {
      const [osrmWalk, osrmDrive, osrmCycle, transitData] = await Promise.allSettled([
        fetchOSRM('walking',  from, to),
        fetchOSRM('driving',  from, to),
        fetchOSRM('cycling',  from, to),
        fetchTransitous(from, to),
      ])

      const built = buildRoutes(osrmWalk, osrmDrive, osrmCycle, transitData, from, to)
      setRoutes(built)
      setActiveRouteIdx(0)

      const available = built.filter(r => !r.unavailable)
      showToast(`✅ ${available.length} routes found`, 'success')
    } catch (err) {
      showToast('⚠️ Routing error — check connection', 'warn')
    }

    setLoading(false)
  }, [from, to, showToast])

  // ── Save / load home ──────────────────────────
  const handleSetHome = useCallback(() => {
    if (!to) return
    localStorage.setItem('homerun_home', JSON.stringify(to))
    setHome(to)
    showToast('🏠 Home destination saved', 'success')
  }, [to, showToast])

  const handleLoadHome = useCallback(() => {
    if (home) setTo(home)
  }, [home])

  // ── Nearby stop click ─────────────────────────
  const handleNearbyStopClick = useCallback((stop) => {
    flyTo(stop.lat, stop.lon, 17)
    showToast(`${stop.icon} ${stop.label}`)
  }, [flyTo, showToast])

  // ── Centre on me ──────────────────────────────
  const handleCentreMe = useCallback(() => {
    if (from) {
      flyTo(from.lat, from.lon, 15)
    } else {
      handleGetLocation()
    }
  }, [from, flyTo, handleGetLocation])

  // ── SOS ───────────────────────────────────────
  const handleSOS = useCallback(() => {
    if (!from) {
      showToast('❌ No location set — tap "I Landed Here" first', 'error')
      return
    }
    const text = encodeURIComponent(
      `🆘 EMERGENCY — I need help!\n\nI'm at: ${from.name}\nCoords: ${from.lat.toFixed(5)}, ${from.lon.toFixed(5)}\nTrack me: ${window.location.href}`
    )
    window.open(`sms:?body=${text}`)
    showToast('🆘 SOS SMS opened', 'warn')
  }, [from, showToast])

  // ── Keyboard shortcut: toggle sidebar ─────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setShowShare(false)
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') setSidebarOpen(o => !o)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Layout ────────────────────────────────────
  const mapLeft = sidebarOpen ? `${SIDEBAR_WIDTH}px` : '0px'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',

        // Bigger UI text globally (can be overridden by component styles)
        fontSize: '16px',
        lineHeight: 1.35,
      }}
    >

      {/* ── Map container ── */}
      <div
        ref={mapContainerRef}
        style={{
          position: 'fixed',
          top: '44px', left: mapLeft, right: 0, bottom: 0,
          zIndex: 1,
          transition: `left 0.25s var(--ease-smooth)`,
        }}
      />

      {/* ── Top bar ── */}
      <TopBar
        from={from}
        to={to}
        onShareClick={(msg) => showToast(msg)}
        onSidebarToggle={() => setSidebarOpen(o => !o)}
        sidebarOpen={sidebarOpen}
      />

      {/* ── Sidebar ── */}
      <Sidebar
        open={sidebarOpen}
        width={SIDEBAR_WIDTH}
        from={from}
        to={to}
        onFromChange={setFrom}
        onFromClear={() => setFrom(null)}
        onToChange={setTo}
        onToClear={() => setTo(null)}
        home={home}
        onSetHome={handleSetHome}
        onLoadHome={handleLoadHome}
        onGetLocation={handleGetLocation}
        routes={routes}
        activeRouteIdx={activeRouteIdx}
        onRouteSelect={setActiveRouteIdx}
        loading={loading}
        nearbyStops={nearbyStops}
        onNearbyStopClick={handleNearbyStopClick}
        onGetRoutes={handleGetRoutes}
      />

      {/* ── Map toolbar (right side) ── */}
      <MapToolbar
        onCentreMe={handleCentreMe}
        onSharePanel={() => setShowShare(true)}
        onSOS={handleSOS}
        sidebarOpen={sidebarOpen}
      />

      {/* ── Share panel ── */}
      {showShare && (
        <SharePanel
          from={from}
          to={to}
          onClose={() => setShowShare(false)}
          showToast={showToast}
        />
      )}

      {/* ── Leaflet UI + map visibility tweaks ── */}
      <style>{`
        /* Keep attribution aligned when sidebar opens */
        .leaflet-control-attribution {
          margin-left: ${sidebarOpen ? SIDEBAR_WIDTH + 'px' : '0px'} !important;
          transition: margin-left 0.25s;

          font-size: 13px !important;
          padding: 6px 8px !important;
          background: rgba(10, 16, 26, 0.72) !important;
          color: rgba(255,255,255,0.78) !important;
          backdrop-filter: blur(6px);
          border: 1px solid rgba(0,229,255,0.18);
          border-radius: 10px;
        }

        /* Make zoom controls easier to hit + more readable */
        .leaflet-control-zoom {
          margin-right: 56px !important;
          margin-bottom: 20px !important;
          border: 1px solid rgba(0,229,255,0.18) !important;
          border-radius: 12px !important;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        .leaflet-control-zoom a {
          width: 44px !important;
          height: 44px !important;
          line-height: 44px !important;
          font-size: 22px !important;
          background: rgba(10, 16, 26, 0.72) !important;
          color: rgba(255,255,255,0.9) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(18, 28, 44, 0.82) !important;
        }

        /* Brighten dark tiles (keeps your dark theme but improves visibility) */
        .leaflet-tile {
          filter: brightness(1.18) contrast(1.06) saturate(1.08);
        }

        /* Make overlays pop slightly */
        .leaflet-overlay-pane svg path {
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));
        }
      `}</style>

      {/* ── Toasts ── */}
      <ToastStack toasts={toasts}/>

    </div>
  )
}
