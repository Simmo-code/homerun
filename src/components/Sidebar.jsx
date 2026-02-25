// Sidebar — PureTrack-style collapsible left panel
import { useState } from 'react'
import SearchInput from './SearchInput'
import { fmtDuration, fmtDistance, taxiEstimate } from '../utils/api'

// ── Icons ──────────────────────────────────────

function IconGPS() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
      <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" strokeDasharray="2 2"/>
    </svg>
  )
}

function IconChevron({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ transition: 'transform 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

// ── Route Card ─────────────────────────────────

function RouteCard({ route, active, onClick, onExpand }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? `${route.color}0d` : 'transparent',
        border: `1px solid ${active ? route.color + '40' : 'var(--border-subtle)'}`,
        borderRadius: '8px', cursor: 'pointer', marginBottom: '6px',
        transition: 'all 0.15s', overflow: 'hidden',
        opacity: route.unavailable ? 0.4 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
        {/* Colour bar */}
        <div style={{
          width: '3px', background: route.unavailable ? 'var(--border-default)' : route.color,
          borderRadius: '8px 0 0 8px', flexShrink: 0,
        }}/>

        <div style={{ padding: '10px 10px', flex: 1, minWidth: 0 }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700,
              color: route.unavailable ? 'var(--text-muted)' : route.color,
              lineHeight: 1,
            }}>
              {route.unavailable ? '—' : fmtDuration(route.duration)}
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {route.fastest && !route.unavailable && (
                <span style={{
                  background: 'rgba(0,230,118,0.1)', color: 'var(--green)',
                  border: '1px solid rgba(0,230,118,0.25)',
                  borderRadius: '4px', padding: '2px 6px',
                  fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
                }}>⚡ FASTEST</span>
              )}
              {route.unavailable && (
                <span style={{
                  background: 'rgba(255,61,61,0.1)', color: 'var(--red)',
                  border: '1px solid rgba(255,61,61,0.2)',
                  borderRadius: '4px', padding: '2px 6px',
                  fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
                }}>N/A</span>
              )}
            </div>
          </div>

          {/* Summary */}
          <div style={{
            fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '6px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {route.summary}
          </div>

          {/* Legs */}
          {route.legs?.length > 0 && (
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center', flexWrap: 'wrap' }}>
              {route.legs.map((leg, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {i > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>›</span>}
                  <span style={{
                    padding: '2px 6px', borderRadius: '12px',
                    background: `${leg.color}18`,
                    border: `1px solid ${leg.color}30`,
                    color: leg.color, fontSize: '10px', fontWeight: 600,
                    fontFamily: 'var(--font-ui)',
                  }}>
                    {leg.icon} {leg.label}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          {!route.unavailable && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)',
            }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {route.distance > 0 ? fmtDistance(route.distance) : ''}
                {route.transfers !== undefined ? ` · ${route.transfers} change${route.transfers !== 1 ? 's' : ''}` : ''}
              </span>
              {!route.unavailable && (
                <button
                  onClick={e => { e.stopPropagation(); onExpand() }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)', fontSize: '10px',
                    fontFamily: 'var(--font-ui)', fontWeight: 600,
                    padding: '0', letterSpacing: '0.3px',
                  }}
                >
                  Steps ›
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Step Detail ────────────────────────────────

function StepDetail({ route, onBack }) {
  return (
    <div style={{ animation: 'slideInLeft 0.15s ease' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)',
          fontSize: '13px', fontWeight: 600, padding: '0 0 10px 0',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}
      >
        ‹ Back to routes
      </button>

      <div style={{
        background: `${route.color}0d`, border: `1px solid ${route.color}30`,
        borderRadius: '8px', padding: '10px 12px', marginBottom: '12px',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ fontSize: '20px' }}>{route.icon}</span>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: route.color }}>{route.label}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {fmtDuration(route.duration)}
            {route.distance > 0 ? ` · ${fmtDistance(route.distance)}` : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {route.steps?.length > 0 ? route.steps.map((step, i) => (
          <div key={i} style={{
            display: 'flex', gap: '10px', padding: '8px 0',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
              background: `${step.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            }}>{step.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.3, marginBottom: '2px' }}>
                {step.action}
              </div>
              {step.from && <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>From: {step.from}</div>}
              {step.to   && <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>To: {step.to}</div>}
              {step.meta && <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>{step.meta}</div>}
            </div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '20px 0', fontFamily: 'var(--font-mono)' }}>
            No step-by-step data available
          </div>
        )}
      </div>
    </div>
  )
}

// ── Nearby Section ─────────────────────────────

function NearbySection({ stops, onStopClick }) {
  const [expanded, setExpanded] = useState(true)
  const allStops = Object.values(stops).flat()
  if (allStops.length === 0) return null

  return (
    <div style={{ marginTop: '12px' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 0', marginBottom: '6px',
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '2px' }}>
          NEARBY TRANSPORT
        </span>
        <IconChevron open={expanded}/>
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {allStops.slice(0, 8).map((stop, i) => (
            <div
              key={i}
              onClick={() => onStopClick(stop)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '7px 9px', borderRadius: '7px', cursor: 'pointer',
                border: '1px solid var(--border-subtle)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--surface-2)'
                e.currentTarget.style.borderColor = 'var(--border-default)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'var(--border-subtle)'
              }}
            >
              <span style={{ fontSize: '14px', flexShrink: 0 }}>{stop.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '12px', fontWeight: 600, lineHeight: 1.2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{stop.label}</div>
                {(stop.routes || stop.lines) && (
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {stop.routes || stop.lines}
                  </div>
                )}
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px',
                color: 'var(--text-muted)', flexShrink: 0,
              }}>{Math.round(stop.dist)}m</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Sidebar ───────────────────────────────

export default function Sidebar({
  open, width,
  from, to, onFromChange, onFromClear, onToChange, onToClear,
  home, onSetHome, onLoadHome,
  onGetLocation,
  routes, activeRouteIdx, onRouteSelect,
  loading,
  nearbyStops, onNearbyStopClick,
  onGetRoutes,
}) {
  const [detailRoute, setDetailRoute] = useState(null)

  const sidebarStyle = {
    position: 'fixed', top: '44px', left: 0, bottom: 0,
    width: open ? `${width}px` : '0px',
    zIndex: 800,
    background: 'rgba(7,11,18,0.97)',
    backdropFilter: 'blur(16px)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex', flexDirection: 'column',
    transition: `width 0.25s var(--ease-smooth)`,
    overflow: 'hidden',
    boxShadow: open ? '4px 0 30px rgba(0,0,0,0.5)' : 'none',
  }

  const innerStyle = {
    width: `${width}px`, // fixed width inner so content doesn't reflow
    height: '100%',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  }

  const scrollStyle = {
    flex: 1, overflowY: 'auto', overflowX: 'hidden',
    padding: '12px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--border-default) transparent',
  }

  const hasRoute = from && to

  return (
    <div style={sidebarStyle}>
      <div style={innerStyle}>
        {/* Search section */}
        <div style={{ borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          {/* GPS button */}
          <div style={{ padding: '10px 12px 8px' }}>
            <button
              onClick={onGetLocation}
              style={{
                width: '100%', height: '46px', borderRadius: '8px',
                background: from ? 'rgba(0,230,118,0.06)' : 'rgba(0,229,255,0.08)',
                border: `1.5px solid ${from ? 'rgba(0,230,118,0.3)' : 'rgba(0,229,255,0.35)'}`,
                color: from ? 'var(--green)' : 'var(--cyan)',
                cursor: 'pointer', fontFamily: 'var(--font-ui)',
                fontSize: '14px', fontWeight: 700, letterSpacing: '1.5px',
                textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s',
                animation: !from ? 'none' : undefined,
                position: 'relative', overflow: 'hidden',
              }}
            >
              {!from && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.06), transparent)',
                  animation: 'scanLine 2s linear infinite',
                }}/>
              )}
              <IconGPS/>
              {from ? '📍 LOCATION SET' : '📡 I LANDED HERE'}
            </button>
          </div>

          {/* FROM / TO inputs */}
          <div style={{ position: 'relative' }}>
            <SearchInput
              value={from}
              onChange={onFromChange}
              onClear={onFromClear}
              placeholder="From — landing location"
              accentColor="var(--cyan)"
              label="FROM"
            />
            {/* Swap / connector line */}
            <div style={{
              position: 'absolute', left: '20px', top: '44px',
              height: '0px', width: '1px', background: 'var(--border-default)',
              zIndex: 1,
            }}/>
            <SearchInput
              value={to}
              onChange={onToChange}
              onClear={onToClear}
              placeholder="Going to — destination"
              accentColor="var(--amber)"
              label="TO"
            />
          </div>

          {/* Quick actions row */}
          <div style={{ display: 'flex', gap: '6px', padding: '6px 12px 10px', flexWrap: 'wrap' }}>
            {home && !to && (
              <button
                onClick={onLoadHome}
                style={{
                  height: '28px', padding: '0 10px', borderRadius: '5px',
                  border: '1px solid rgba(255,193,7,0.3)',
                  background: 'rgba(255,193,7,0.07)',
                  color: 'var(--amber)', cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >🏠 Quick: Home</button>
            )}
            {to && (
              <button
                onClick={onSetHome}
                style={{
                  height: '28px', padding: '0 10px', borderRadius: '5px',
                  border: `1px solid ${home?.name === to.name ? 'rgba(255,193,7,0.4)' : 'var(--border-default)'}`,
                  background: home?.name === to.name ? 'rgba(255,193,7,0.08)' : 'transparent',
                  color: home?.name === to.name ? 'var(--amber)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '4px',
                  transition: 'all 0.15s',
                }}
              >{home?.name === to.name ? '🏠 Home set' : '🏠 Set as Home'}</button>
            )}
          </div>

          {/* Get routes button */}
          <div style={{ padding: '0 12px 10px' }}>
            <button
              disabled={!hasRoute || loading}
              onClick={onGetRoutes}
              style={{
                width: '100%', height: '42px', borderRadius: '8px', border: 'none',
                background: hasRoute && !loading ? 'var(--amber)' : 'var(--surface-3)',
                color: hasRoute && !loading ? '#000' : 'var(--text-muted)',
                cursor: hasRoute && !loading ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-ui)', fontSize: '14px', fontWeight: 800,
                letterSpacing: '1px', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
              }}
            >
              {loading && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
                  background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.3), transparent)',
                  animation: 'scanLine 1s linear infinite',
                }}/>
              )}
              {loading ? '⟳ SCANNING NETWORKS…' : hasRoute ? '🔍 FIND ROUTES' : 'SET FROM & TO FIRST'}
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={scrollStyle}>
          {/* Routes section */}
          {(routes.length > 0 || loading) && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '2px 0 8px',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '9px',
                  color: 'var(--text-muted)', letterSpacing: '2px',
                }}>
                  {loading ? '// SCANNING…' : `// ${routes.filter(r => !r.unavailable).length} ROUTES FOUND`}
                </span>
                {!loading && routes.length > 0 && (
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '9px',
                    color: 'var(--text-muted)',
                  }}>
                    {from?.name?.split(',')[0]} → {to?.name?.split(',')[0]}
                  </span>
                )}
              </div>

              {/* Loading skeleton */}
              {loading && [0,1,2].map(i => (
                <div key={i} style={{
                  height: '80px', borderRadius: '8px', marginBottom: '6px',
                  background: 'linear-gradient(90deg, var(--surface-1), var(--surface-2), var(--surface-1))',
                  backgroundSize: '200% 100%',
                  animation: `shimmer 1.5s ease ${i * 0.15}s infinite`,
                }}/>
              ))}

              {/* Route detail / steps */}
              {detailRoute ? (
                <StepDetail
                  route={routes.find(r => r.id === detailRoute)}
                  onBack={() => setDetailRoute(null)}
                />
              ) : (
                /* Route cards */
                routes.map((route, i) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    active={i === activeRouteIdx}
                    onClick={() => onRouteSelect(i)}
                    onExpand={() => setDetailRoute(route.id)}
                  />
                ))
              )}
            </div>
          )}

          {/* Nearby stops */}
          {Object.values(nearbyStops).flat().length > 0 && !detailRoute && (
            <NearbySection stops={nearbyStops} onStopClick={onNearbyStopClick}/>
          )}

          {/* Empty state */}
          {routes.length === 0 && !loading && Object.values(nearbyStops).flat().length === 0 && (
            <div style={{
              textAlign: 'center', padding: '32px 16px',
              color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px',
              lineHeight: 1.8, letterSpacing: '0.5px',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '12px', opacity: 0.4 }}>⊕</div>
              TAP "I LANDED HERE"<br/>TO GET STARTED
            </div>
          )}
        </div>

        {/* Bottom status bar */}
        <div style={{
          padding: '8px 12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)' }}>
            OSRM · TRANSITOUS · OSM
          </span>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {['#00e676','#ffc107','#00e5ff'].map((c, i) => (
              <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: c, opacity: 0.5 }}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
