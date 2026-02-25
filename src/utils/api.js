// ═══════════════════════════════════════════════
// HOMERUN — API Utilities
// All free, no backend required
// ═══════════════════════════════════════════════

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const OSRM_BASE      = 'https://router.project-osrm.org'
const TRANSITOUS_BASE= 'https://api.transitous.org/api/v1'
const OVERPASS_BASE  = 'https://overpass-api.de/api/interpreter'

const NOMINATIM_HEADERS = { 'User-Agent': 'HOMERUN-transit-navigator/1.0' }

// ── Geocoding ───────────────────────────────────

export async function geocodeSearch(query, limit = 6) {
  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1&extratags=1`
  const res = await fetch(url, { headers: NOMINATIM_HEADERS })
  if (!res.ok) throw new Error('Geocode search failed')
  return res.json()
}

export async function reverseGeocode(lat, lon) {
  const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
  const res = await fetch(url, { headers: NOMINATIM_HEADERS })
  if (!res.ok) throw new Error('Reverse geocode failed')
  return res.json()
}

// ── OSRM Routing ────────────────────────────────

export async function fetchOSRM(profile, from, to) {
  const url = `${OSRM_BASE}/route/v1/${profile}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&steps=true&annotations=true`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM ${profile} failed`)
  const data = await res.json()
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('No OSRM route found')
  return data.routes[0]
}

// ── Transitous (GTFS-RT public transit) ─────────

export async function fetchTransitous(from, to) {
  const now  = new Date()
  const date = now.toISOString().split('T')[0]
  const time = now.toTimeString().slice(0, 5)
  const url  = `${TRANSITOUS_BASE}/plan?fromLat=${from.lat}&fromLon=${from.lon}&toLat=${to.lat}&toLon=${to.lon}&time=${time}&date=${date}&numItineraries=4`
  const res  = await fetch(url)
  if (!res.ok) throw new Error('Transitous unavailable')
  return res.json()
}

// ── Overpass (nearby transit infrastructure) ────

export function buildOverpassQuery(lat, lon) {
  return `
[out:json][timeout:15];
(
  node["highway"="bus_stop"](around:600,${lat},${lon});
  node["public_transport"="stop_position"]["bus"="yes"](around:600,${lat},${lon});
  node["railway"="station"](around:3000,${lat},${lon});
  node["railway"="halt"](around:2000,${lat},${lon});
  node["amenity"="bicycle_rental"](around:800,${lat},${lon});
  node["amenity"="taxi"](around:1000,${lat},${lon});
);
out body;
`
}

export async function fetchNearby(lat, lon) {
  const query = buildOverpassQuery(lat, lon)
  const res   = await fetch(OVERPASS_BASE, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (!res.ok) throw new Error('Overpass failed')
  const data = await res.json()

  const stops = { bus: [], train: [], bike: [], taxi: [] }

  data.elements?.forEach(el => {
    const dist = haversine(lat, lon, el.lat, el.lon)
    const name = el.tags?.name || el.tags?.ref || null
    const base = { id: el.id, lat: el.lat, lon: el.lon, dist, name, tags: el.tags }

    if (el.tags?.railway === 'station' || el.tags?.railway === 'halt') {
      stops.train.push({ ...base, type: 'train', icon: '🚆',
        label: name || 'Railway Station',
        lines: el.tags?.['railway:ref'] || el.tags?.operator || '',
      })
    } else if (el.tags?.highway === 'bus_stop' || el.tags?.bus === 'yes') {
      stops.bus.push({ ...base, type: 'bus', icon: '🚌',
        label: name || 'Bus Stop',
        routes: el.tags?.['route_ref'] || el.tags?.ref || '',
      })
    } else if (el.tags?.amenity === 'bicycle_rental') {
      stops.bike.push({ ...base, type: 'bike', icon: '🚲',
        label: name || 'Cycle Hire',
        network: el.tags?.network || '',
      })
    } else if (el.tags?.amenity === 'taxi') {
      stops.taxi.push({ ...base, type: 'taxi', icon: '🚕',
        label: name || 'Taxi Rank',
      })
    }
  })

  // Sort each by distance, limit count
  Object.keys(stops).forEach(k => {
    stops[k].sort((a, b) => a.dist - b.dist)
    if (k === 'bus')   stops[k] = stops[k].slice(0, 4)
    if (k === 'train') stops[k] = stops[k].slice(0, 3)
    if (k === 'bike')  stops[k] = stops[k].slice(0, 2)
    if (k === 'taxi')  stops[k] = stops[k].slice(0, 2)
  })

  return stops
}

// ── Helpers ─────────────────────────────────────

export function haversine(lat1, lon1, lat2, lon2) {
  const R    = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a    = Math.sin(dLat / 2) ** 2
             + Math.cos(lat1 * Math.PI / 180)
             * Math.cos(lat2 * Math.PI / 180)
             * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function fmtDuration(seconds) {
  if (!seconds || seconds === Infinity) return '—'
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`
}

export function fmtDistance(meters) {
  if (!meters) return '—'
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function fmtDistanceMi(meters) {
  return `${(meters / 1609.34).toFixed(1)}mi`
}

export function taxiEstimate(meters) {
  const miles = meters / 1609.34
  const low   = Math.max(4, Math.floor((2.8 + miles * 2.3) * 0.85))
  const high  = Math.ceil((2.8 + miles * 2.3) * 1.3)
  return `£${low}–${high}`
}

export function buildShareUrl(from, to) {
  const p = new URLSearchParams()
  if (from) {
    p.set('flat',  from.lat.toFixed(6))
    p.set('flon',  from.lon.toFixed(6))
    p.set('fname', from.name)
  }
  if (to) {
    p.set('tlat',  to.lat.toFixed(6))
    p.set('tlon',  to.lon.toFixed(6))
    p.set('tname', to.name)
  }
  return `${window.location.origin}${window.location.pathname}?${p.toString()}`
}

export function parseUrlParams() {
  const p = new URLSearchParams(window.location.search)
  const from = p.get('flat') && p.get('flon') ? {
    lat:  parseFloat(p.get('flat')),
    lon:  parseFloat(p.get('flon')),
    name: p.get('fname') || `${p.get('flat')}, ${p.get('flon')}`,
  } : null
  const to = p.get('tlat') && p.get('tlon') ? {
    lat:  parseFloat(p.get('tlat')),
    lon:  parseFloat(p.get('tlon')),
    name: p.get('tname') || `${p.get('tlat')}, ${p.get('tlon')}`,
  } : null
  return { from, to }
}

// ── Route builder ────────────────────────────────

export function buildRoutes(osrmWalk, osrmDrive, osrmCycle, transitResult, from, to) {
  const routes = []

  // Walking
  if (osrmWalk.status === 'fulfilled') {
    const r = osrmWalk.value
    routes.push({
      id: 'walk', mode: 'walk', label: 'Walking', icon: '🚶',
      color: '#00e676',
      duration: r.duration, distance: r.distance,
      geometry: r.geometry,
      legs: [{ mode: 'walk', icon: '🚶', color: '#00e676', label: 'Walk',
               duration: r.duration, distance: r.distance }],
      steps: parseOSRMSteps(r, 'walk'),
      summary: `Walk ${fmtDuration(r.duration)}`,
    })
  }

  // Cycling
  if (osrmCycle.status === 'fulfilled') {
    const r = osrmCycle.value
    routes.push({
      id: 'cycle', mode: 'cycle', label: 'Cycling', icon: '🚴',
      color: '#b388ff',
      duration: r.duration, distance: r.distance,
      geometry: r.geometry,
      legs: [{ mode: 'cycle', icon: '🚴', color: '#b388ff', label: 'Cycle',
               duration: r.duration, distance: r.distance }],
      steps: parseOSRMSteps(r, 'cycle'),
      summary: `Cycle ${fmtDuration(r.duration)}`,
    })
  }

  // Driving
  if (osrmDrive.status === 'fulfilled') {
    const r = osrmDrive.value
    routes.push({
      id: 'drive', mode: 'drive', label: 'Drive', icon: '🚗',
      color: '#82b1ff',
      duration: r.duration, distance: r.distance,
      geometry: r.geometry,
      legs: [{ mode: 'drive', icon: '🚗', color: '#82b1ff', label: 'Drive',
               duration: r.duration, distance: r.distance }],
      steps: parseOSRMSteps(r, 'drive'),
      summary: `Drive ${fmtDuration(r.duration)}`,
    })
    // Taxi variant
    routes.push({
      id: 'taxi', mode: 'taxi', label: 'Taxi', icon: '🚕',
      color: '#ff9100',
      duration: r.duration * 1.1, distance: r.distance,
      geometry: r.geometry,
      legs: [{ mode: 'taxi', icon: '🚕', color: '#ff9100',
               label: `Taxi ≈${taxiEstimate(r.distance)}`,
               duration: r.duration, distance: r.distance }],
      steps: parseOSRMSteps(r, 'taxi'),
      summary: `Taxi ${fmtDuration(r.duration)} · est. ${taxiEstimate(r.distance)}`,
      costEstimate: taxiEstimate(r.distance),
    })
  }

  // Public transit
  const plan = transitResult?.status === 'fulfilled' ? transitResult.value?.plan : null
  if (plan?.itineraries?.length) {
    plan.itineraries.slice(0, 2).forEach((itin, idx) => {
      const legs = (itin.legs || []).map(l => ({
        mode:     l.mode?.toLowerCase() || 'walk',
        icon:     modeIcon(l.mode),
        color:    modeColor(l.mode),
        label:    l.route?.shortName
                    ? `${l.mode === 'WALK' ? 'Walk' : l.route.shortName}${l.headsign ? ' → ' + l.headsign : ''}`
                    : l.mode === 'WALK' ? 'Walk' : l.mode,
        duration: (l.endTime - l.startTime) / 1000,
        distance: l.distance || 0,
        from:     l.from?.name,
        to:       l.to?.name,
      }))
      const summary = legs.map(l => `${l.icon} ${l.label}`).join(' → ')
      routes.push({
        id:       `transit_${idx}`,
        mode:     'transit',
        label:    idx === 0 ? 'Transit' : 'Transit (alt)',
        icon:     '🚌',
        color:    '#ffc107',
        duration: itin.duration,
        distance: itin.walkDistance || 0,
        geometry: null,
        legs,
        steps: legs.map(l => ({
          icon:   l.icon,
          color:  l.color,
          action: l.label,
          meta:   `${fmtDuration(l.duration)} · ${fmtDistance(l.distance)}`,
          from:   l.from,
          to:     l.to,
        })),
        summary,
        transfers: (itin.transfers || 0),
      })
    })
  } else {
    routes.push({
      id: 'transit', mode: 'transit', label: 'Transit', icon: '🚌',
      color: '#ffc107', unavailable: true,
      duration: Infinity, distance: 0,
      geometry: null, legs: [], steps: [],
      summary: 'No transit data for this route',
    })
  }

  // Sort: available first by duration, unavailable last
  routes.sort((a, b) => {
    if (a.unavailable) return 1
    if (b.unavailable) return -1
    return a.duration - b.duration
  })

  // Tag fastest
  const fastest = routes.find(r => !r.unavailable)
  if (fastest) fastest.fastest = true

  return routes
}

function modeIcon(mode) {
  const m = { WALK: '🚶', BUS: '🚌', RAIL: '🚆', SUBWAY: '🚇', TRAM: '🚋', FERRY: '⛴️' }
  return m[mode?.toUpperCase()] || '🚌'
}

function modeColor(mode) {
  const m = { WALK: '#00e676', BUS: '#ffc107', RAIL: '#00e5ff', SUBWAY: '#00e5ff', TRAM: '#ff9100' }
  return m[mode?.toUpperCase()] || '#ffc107'
}

function parseOSRMSteps(route, mode) {
  const iconMap  = { walk: '🚶', drive: '🚗', cycle: '🚴', taxi: '🚕' }
  const colorMap = { walk: '#00e676', drive: '#82b1ff', cycle: '#b388ff', taxi: '#ff9100' }
  const steps    = []

  route.legs?.forEach(leg => {
    leg.steps?.forEach(step => {
      const { type, modifier } = step.maneuver || {}
      if (type === 'arrive') {
        steps.push({ icon: '📍', color: '#ffc107', action: 'Arrive at destination', meta: '' })
        return
      }
      const dir    = modifier ? ` ${modifier}` : ''
      const street = step.name ? ` onto ${step.name}` : ''
      steps.push({
        icon:   iconMap[mode] || '▶',
        color:  colorMap[mode] || '#fff',
        action: `${capitalize(type || '')}${dir}${street}`,
        meta:   `${fmtDuration(step.duration)} · ${fmtDistance(step.distance)}`,
      })
    })
  })

  return steps
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ') : ''
}
