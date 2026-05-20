const ICONS = { SUCCESS: '✓', FAILED: '✕', PROCESSING: '⏳', INITIATED: '◷' }
const BADGE = {
  SUCCESS:    { bg: 'var(--green-dim)', color: '#28d98a', border: 'rgba(34,201,126,.3)'  },
  FAILED:     { bg: 'var(--red-dim)',   color: '#f07070', border: 'rgba(240,82,82,.3)'   },
  PROCESSING: { bg: 'var(--yellow-dim)',color: '#f0c850', border: 'rgba(240,180,41,.3)'  },
  INITIATED:  { bg: 'var(--blue-dim)', color: '#6aadf7', border: 'rgba(59,142,240,.3)'   },
}

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })
}

function Badge({ status }) {
  const b = BADGE[status] || BADGE.INITIATED
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 11px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, letterSpacing: '.02em',
      background: b.bg, color: b.color, border: `1px solid ${b.border}`,
    }}>
      {ICONS[status]} {status}
    </span>
  )
}

export default function ResultPanel({ tx, polling }) {
  if (!tx) return null
  const live = polling && (tx.status === 'PROCESSING' || tx.status === 'INITIATED')
  const rows = [
    ['Transaction ID', tx.id],
    ['Amount',         `₹${tx.amount}`],
    ['Retry Count',    `${tx.retryCount} / 3`],
    ['Version (OL)',   tx.version],
    ['Created',        fmt(tx.createdAt)],
    ['Updated',        fmt(tx.updatedAt)],
  ]
  return (
    <div style={{
      marginTop: 16, background: 'var(--bg)', border: '1px solid var(--border)',
      borderRadius: 10, padding: 15, animation: 'sd .2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
        <Badge status={tx.status} />
        {live && (
          <span style={{ fontSize: 11, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Spinner color="var(--yellow)" /> Auto-refreshing…
          </span>
        )}
      </div>
      <div>
        {rows.map(([k, v]) => (
          <div key={k} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ color: 'var(--txt2)', flexShrink: 0, marginRight: 10 }}>{k}</span>
            <span style={{ color: 'var(--txt)', fontFamily: 'monospace', fontSize: 11.5, textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ErrorPanel({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      marginTop: 13, background: 'var(--red-dim)', border: '1px solid rgba(240,82,82,.3)',
      borderRadius: 8, padding: '11px 13px', color: '#f07070', fontSize: 12,
      animation: 'sd .2s ease',
    }}>
      ⚠ {msg}
    </div>
  )
}

export function Spinner({ color = '#fff' }) {
  return (
    <span style={{
      display: 'inline-block', width: 12, height: 12,
      border: `2px solid rgba(255,255,255,.25)`, borderTopColor: color,
      borderRadius: '50%', animation: 'rot .6s linear infinite',
      verticalAlign: 'middle', marginRight: 5,
    }} />
  )
}
