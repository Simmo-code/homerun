// ═══════════════════════════════════════════════
// useMap — Leaflet map lifecycle hook
// ═══════════════════════════════════════════════

import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'

const TILE_URL    = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIB = '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CartoDB</a>'

// Mode style config
const MODE_STYLE = {
  walk:    { color: '#00e676', weight: 3, dashArray: '7 7',   opacity: 1    },
  cycle:   { color: '#b388ff', weight: 3, dashArray: '5 5',   opacity: 1    },
  drive:   { color: '#82b1ff', weight: 4, dashArray: null,    opacity: 0.85 },
  taxi:    { color: '#ff9100', weight: 4, dashArray: '10 4',  opacity: 0.85 },
  transit: { color: '#ffc107', weight: 5, dashArray: null,    opacity: 1    },
}

function createMarkerHTML(label, color, glow) {
  return `
    <div style="
      width:26px; height:26px; border-radius:50%;
      background:${color};
      border:3px solid rgba(255,255,255,0.9);
      box-shadow:0 0 ${glow ? '16px ' + color : '6px rgba(0,0,0,0.5)'};
      display:flex; align-items:center; justify-content:center;
      font-family:'Barlow Condensed',sans-serif;
      font-size:11px; font-weight:900; color:#000;
      position:relative;
    ">
      ${label}
      ${glow ? `<div style="
        position:absolute; inset:-8px; border-radius:50%;
        border:2px solid ${color}; opacity:0.4;
        animation:pulseRing 2s ease-out infinite;
      "></div>` : ''}
    </div>
  `
}

function createStopHTML(type) {
  const config = {
    bus:   { bg: '#ffc107', symbol: '🚌', size: 14 },
    train: { bg: '#00e5ff', symbol: '🚆', size: 18 },
    bike:  { bg: '#00e676', symbol: '🚲', size: 14 },
    taxi:  { bg: '#ff9100', symbol: '🚕', size: 14 },
  }[type] || { bg: '#fff', symbol: '●', size: 12 }

  return `
    <div style="
      width:${config.size}px; height:${config.size}px;
      border-radius:3px; background:${config.bg};
      border:1.5px solid rgba(0,0,0,0.4);
      display:flex; align-items:center; justify-content:center;
      font-size:8px; cursor:pointer;
    ">${config.symbol}</div>
  `
}

export function useMap(containerRef) {
  const mapRef       = useRef(null)
  const layersRef    = useRef({ from: null, to: null, home: null, routes: [], stops: [], youAreHere: null })

  // ── Initialise map ────────────────────────────
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = L.map(containerRef.current, {
      center:           [51.505, -0.09],
      zoom:             5,
      zoomControl:      false,
      attributionControl: true,
      preferCanvas:     true,
    })

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIB,
      subdomains:  'abcd',
      maxZoom:     20,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── Set FROM marker ───────────────────────────
  const setFromMarker = useCallback((loc) => {
    const map = mapRef.current; if (!map) return
    const layers = layersRef.current
    if (layers.from) { map.removeLayer(layers.from); layers.from = null }
    if (!loc) return

    const icon = L.divIcon({
      html: createMarkerHTML('A', '#00e5ff', true),
      className: '', iconSize: [26, 26], iconAnchor: [13, 13],
    })
    layers.from = L.marker([loc.lat, loc.lon], { icon, zIndexOffset: 100 })
      .addTo(map)
      .bindPopup(`<div style="padding:10px 12px;font-family:var(--font-ui)"><div style="font-size:10px;color:#6b8299;letter-spacing:1px;margin-bottom:4px">FROM</div><div style="font-size:14px;font-weight:600">${loc.name}</div><div style="font-size:11px;color:#6b8299;font-family:'JetBrains Mono',monospace;margin-top:4px">${loc.lat.toFixed(5)}, ${loc.lon.toFixed(5)}</div></div>`)
  }, [])

  // ── Set TO marker ─────────────────────────────
  const setToMarker = useCallback((loc) => {
    const map = mapRef.current; if (!map) return
    const layers = layersRef.current
    if (layers.to) { map.removeLayer(layers.to); layers.to = null }
    if (!loc) return

    const icon = L.divIcon({
      html: createMarkerHTML('B', '#ffc107', false),
      className: '', iconSize: [26, 26], iconAnchor: [13, 13],
    })
    layers.to = L.marker([loc.lat, loc.lon], { icon, zIndexOffset: 90 })
      .addTo(map)
      .bindPopup(`<div style="padding:10px 12px;font-family:var(--font-ui)"><div style="font-size:10px;color:#6b8299;letter-spacing:1px;margin-bottom:4px">DESTINATION</div><div style="font-size:14px;font-weight:600">${loc.name}</div></div>`)
  }, [])

  // ── Set Home marker ───────────────────────────
  const setHomeMarker = useCallback((loc) => {
    const map = mapRef.current; if (!map) return
    const layers = layersRef.current
    if (layers.home) { map.removeLayer(layers.home); layers.home = null }
    if (!loc) return

    const icon = L.divIcon({
      html: `<div style="font-size:18px;filter:drop-shadow(0 2px 8px rgba(255,193,7,0.7))">🏠</div>`,
      className: '', iconSize: [24, 24], iconAnchor: [12, 20],
    })
    layers.home = L.marker([loc.lat, loc.lon], { icon, zIndexOffset: 50, interactive: false }).addTo(map)
  }, [])

  // ── Draw routes ───────────────────────────────
  const drawRoutes = useCallback((routes, activeIdx) => {
    const map = mapRef.current; if (!map) return
    const layers = layersRef.current
    layers.routes.forEach(l => map.removeLayer(l))
    layers.routes = []

    routes.forEach((route, i) => {
      if (!route.geometry) return
      const isActive = i === activeIdx
      const style    = MODE_STYLE[route.mode] || MODE_STYLE.drive
      const layer    = L.geoJSON(route.geometry, {
        style: {
          color:     style.color,
          weight:    isActive ? style.weight + 2 : style.weight,
          dashArray: style.dashArray,
          opacity:   isActive ? 1 : 0.25,
          lineCap:   'round',
          lineJoin:  'round',
        }
      }).addTo(map)
      layers.routes.push(layer)
    })
  }, [])

  // ── Draw nearby stops ─────────────────────────
  const drawNearbyStops = useCallback((stopGroups, onStopClick) => {
    const map = mapRef.current; if (!map) return
    const layers = layersRef.current
    layers.stops.forEach(l => map.removeLayer(l))
    layers.stops = []

    Object.values(stopGroups).flat().forEach(stop => {
      if (!stop.lat || !stop.lon) return
      const icon = L.divIcon({
        html:      createStopHTML(stop.type),
        className: '',
        iconSize:  [16, 16],
        iconAnchor:[8, 8],
      })
      const marker = L.marker([stop.lat, stop.lon], { icon, zIndexOffset: 10 })
        .addTo(map)
        .bindPopup(`
          <div style="padding:8px 10px;font-family:var(--font-ui)">
            <div style="font-size:13px;font-weight:600;margin-bottom:2px">${stop.label}</div>
            ${stop.routes ? `<div style="font-size:11px;color:#6b8299">Routes: ${stop.routes}</div>` : ''}
            ${stop.lines  ? `<div style="font-size:11px;color:#6b8299">${stop.lines}</div>` : ''}
            <div style="font-size:11px;color:#3a4f66;font-family:'JetBrains Mono',monospace;margin-top:4px">${Math.round(stop.dist)}m away</div>
          </div>
        `)
      if (onStopClick) {
        marker.on('click', () => onStopClick(stop))
      }
      layers.stops.push(marker)
    })
  }, [])

  // ── Fly to bounds ─────────────────────────────
  const flyToBounds = useCallback((from, to) => {
    const map = mapRef.current; if (!map) return
    if (from && to) {
      map.flyToBounds([[from.lat, from.lon], [to.lat, to.lon]], {
        padding: [80, 80], duration: 1.4, easeLinearity: 0.3,
      })
    } else if (from) {
      map.flyTo([from.lat, from.lon], 14, { duration: 1.2 })
    }
  }, [])

  // ── Fly to location ───────────────────────────
  const flyTo = useCallback((lat, lon, zoom = 16) => {
    const map = mapRef.current; if (!map) return
    map.flyTo([lat, lon], zoom, { duration: 0.9 })
  }, [])

  // ── You Are Here dot ──────────────────────────
  const setYouAreHere = useCallback((lat, lon) => {
    const map = mapRef.current; if (!map) return
    const layers = layersRef.current
    if (layers.youAreHere) { map.removeLayer(layers.youAreHere); layers.youAreHere = null }

    const icon = L.divIcon({
      html: `
        <div style="position:relative;width:16px;height:16px">
          <div style="
            position:absolute;inset:0;border-radius:50%;
            background:rgba(0,229,255,0.15);
            animation:pulseRing 2s ease-out infinite;
          "></div>
          <div style="
            position:absolute;inset:2px;border-radius:50%;
            background:#00e5ff;border:2px solid #fff;
            box-shadow:0 0 10px #00e5ff;
          "></div>
        </div>
      `,
      className: '', iconSize: [16, 16], iconAnchor: [8, 8],
    })
    layers.youAreHere = L.marker([lat, lon], { icon, zIndexOffset: 200, interactive: false }).addTo(map)
  }, [])

  return { mapRef, setFromMarker, setToMarker, setHomeMarker, drawRoutes, drawNearbyStops, flyToBounds, flyTo, setYouAreHere }
}
