# ⊕ HOMERUN — Remote Landing Transit Navigator

> Find your way home after landing anywhere. Built for paragliders, hang gliders, and outdoor adventurers.

![HOMERUN UI](https://img.shields.io/badge/UI-PureTrack--style-00e5ff?style=flat-square)
![Tech](https://img.shields.io/badge/stack-Vite%205%20%2B%20React%2018%20%2B%20Leaflet-ffc107?style=flat-square)
![Free APIs](https://img.shields.io/badge/APIs-100%25%20free-00e676?style=flat-square)

---

## Features

- 📡 **One-tap GPS** — "I Landed Here" button gets your location instantly
- 🗺️ **Multi-modal routing** — Walk · Transit · Drive · Cycle · Taxi
- 🚌 **Real transit data** — Powered by Transitous (GTFS-RT, Europe-wide)
- 🚆 **Nearby transport** — Bus stops, train stations, cycle hire via Overpass API
- 🏠 **Home memory** — Saves your home destination across sessions
- 📤 **Deep share** — Google Maps, Citymapper, SMS, Web Share API
- 🆘 **SOS mode** — One tap sends your coordinates via SMS
- 🔗 **URL encoding** — Share links auto-restore full route
- **PureTrack-style UI** — Collapsible sidebar, map-first, dark themed

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Vite 5 + React 18 |
| Map | Leaflet 1.9 + react-leaflet 4 |
| Tiles | CartoDB Dark Matter (free) |
| Routing | OSRM public API (free) |
| Transit | Transitous / Motis GTFS-RT (free) |
| Geocoding | OpenStreetMap Nominatim (free) |
| Nearby | Overpass API (free) |
| Fonts | JetBrains Mono + Barlow Condensed |

**No backend. No API keys. 100% free data sources.**

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (opens at http://localhost:3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Deploy to GitHub Pages

1. Edit `vite.config.js` — change `base` to your repo name:
   ```js
   base: '/your-repo-name/',
   ```

2. Add homepage to `package.json`:
   ```json
   "homepage": "https://yourusername.github.io/your-repo-name/"
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

---

## Project Structure

```
src/
├── App.jsx                  # Main app, all state, layout
├── main.jsx                 # Entry point
├── styles/
│   └── global.css           # Design system, Leaflet overrides
├── hooks/
│   ├── useMap.js            # Leaflet lifecycle (markers, routes, layers)
│   └── useToast.js          # Toast notification system
├── utils/
│   └── api.js               # All API calls + data helpers
└── components/
    ├── TopBar.jsx            # Thin header with status indicators
    ├── Sidebar.jsx           # Collapsible left panel (PureTrack-style)
    │                           ├── GPS / search inputs
    │                           ├── Route cards
    │                           ├── Step-by-step detail
    │                           └── Nearby transport list
    ├── MapToolbar.jsx        # Right-side icon toolbar
    ├── SharePanel.jsx        # Slide-up share / export
    └── ToastStack.jsx        # Notification toasts
```

---

## API Notes

### Nominatim (geocoding)
- Max 1 req/second — inputs are debounced at 420ms
- Requires `User-Agent` header (set in api.js)
- Free, no key needed

### OSRM (routing)
- Public instance — walking, driving, cycling profiles
- Reliable, no key needed
- Falls back gracefully per mode

### Transitous (public transit)
- GTFS-RT transit routing for Europe
- Returns real itineraries with legs (walk → bus → train)
- May be unavailable for some regions — shows "N/A" card gracefully

### Overpass API
- Queries bus stops within 600m, train stations within 3km
- Results appear as map markers + sidebar list

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl/⌘ + \` | Toggle sidebar |
| `Esc` | Close share panel |

---

## Stretch Goals (not yet implemented)

- [ ] Service Worker offline tile caching
- [ ] Live bus arrival countdowns (Transitous RT)
- [ ] What3Words / Plus.codes address display
- [ ] Uber / Bolt deep links
- [ ] Recent journeys history
- [ ] Open-Meteo weather widget at landing site

---

## License

MIT — free to fork, modify, deploy.
