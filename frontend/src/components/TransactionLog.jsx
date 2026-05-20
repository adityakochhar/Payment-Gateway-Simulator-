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

export default function TransactionLog({ txList, onSelect }) {
  const cols = '150px 1fr 150px 70px 100px'
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--green-dim)', border: '1px solid rgba(34,201,126,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📋</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Transaction History</div>
          <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 2 }}>Click any row to load it into the status checker</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--txt3)' }}>
          {txList.length} transaction{txList.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 10, padding: '6px 12px 10px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--txt3)', borderBottom: '1px solid var(--border)' }}>
        <div>Status</div><div>Transaction ID</div><div>Timestamp</div>
        <div style={{ textAlign: 'center' }}>Retries</div>
        <div style={{ textAlign: 'right' }}>Amount</div>
      </div>

      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {txList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)', fontSize: 13 }}>
            No transactions yet — initiate a payment above.
          </div>
        ) : txList.map(tx => {
          const b = BADGE[tx.status] || BADGE.INITIATED
          return (
            <div key={tx.id}
              onClick={() => onSelect(tx.id)}
              style={{ display: 'grid', gridTemplateColumns: cols, gap: 10, padding: '11px 12px', borderRadius: 8, cursor: 'pointer', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: b.bg, color: b.color, border: `1px solid ${b.border}` }}>
                  {ICONS[tx.status]} {tx.status}
                </span>
              </div>
              <div style={{ color: '#5ea7f5', fontFamily: 'monospace', fontSize: 11 }}>{tx.id.slice(0, 26)}…</div>
              <div style={{ color: 'var(--txt2)', fontSize: 11 }}>{fmt(tx.createdAt)}</div>
              <div style={{ color: 'var(--txt2)', textAlign: 'center', fontSize: 12 }}>{tx.retryCount}</div>
              <div style={{ color: '#88e06e', fontWeight: 600, fontSize: 13, textAlign: 'right' }}>₹{tx.amount}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
