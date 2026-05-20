export default function StatsBar({ stats }) {
  const s = stats || {}
  const items = [
    { label: 'Total Transactions', value: s.total,      hint: 'all time',          cls: 'var(--txt)'    },
    { label: 'Successful',         value: s.success,    hint: 'terminal · SUCCESS', cls: 'var(--green)'  },
    { label: 'Processing',         value: s.processing, hint: 'pending retry',      cls: 'var(--yellow)' },
    { label: 'Failed',             value: s.failed,     hint: 'terminal · FAILED',  cls: 'var(--red)'    },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', background: 'var(--border)', gap: 1, borderBottom: '1px solid var(--border)' }}>
      {items.map(item => (
        <div key={item.label} style={{ background: 'var(--bg2)', padding: '20px 28px' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--txt3)', marginBottom: 8 }}>
            {item.label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: item.cls }}>
            {item.value ?? '—'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 5 }}>{item.hint}</div>
        </div>
      ))}
    </div>
  )
}
