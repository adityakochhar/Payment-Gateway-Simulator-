export default function StateMachine() {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--green-dim)', border: '1px solid rgba(34,201,126,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔄</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Transaction State Machine</div>
          <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 2 }}>Transitions are strictly enforced — no skipping, no going backwards</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap', margin: '24px 0 28px' }}>
        <Node icon="◷" label="INITIATED"  sub="Created in DB"        cls="ini" />
        <Arrow />
        <Node icon="⏳" label="PROCESSING" sub="Payment in flight"    cls="proc" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginLeft: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Arrow />
            <Node icon="✓" label="SUCCESS" sub="Terminal · webhook fired"        cls="ok" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Arrow />
            <Node icon="✕" label="FAILED"  sub="After 3 retries · webhook fired" cls="fail" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <InfoBox color="#6aadf7" title="🔁 Idempotency"
          body="Redis check → MySQL fallback → 24 hr TTL. The same idempotency key always returns the same transaction — never charged twice." />
        <InfoBox color="#f0c850" title="⏱ Exponential Backoff"
          body="RetryService polls every 5s. Retry 1 → wait 2s, Retry 2 → wait 4s, Retry 3 → wait 8s. Permanent FAILED after 3 failures." />
        <InfoBox color="#28d98a" title="🔒 Optimistic Locking"
          body="JPA @Version on every transaction row. Concurrent state updates throw an exception instead of silently corrupting data." />
      </div>
    </div>
  )
}

const nodeStyles = {
  ini:  { bg: 'var(--blue-dim)',   border: 'rgba(59,142,240,.4)',  color: '#6aadf7' },
  proc: { bg: 'var(--yellow-dim)', border: 'rgba(240,180,41,.4)',  color: '#f0c850' },
  ok:   { bg: 'var(--green-dim)',  border: 'rgba(34,201,126,.4)',  color: '#28d98a' },
  fail: { bg: 'var(--red-dim)',    border: 'rgba(240,82,82,.4)',   color: '#f07070' },
}

function Node({ icon, label, sub, cls }) {
  const s = nodeStyles[cls]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 96, height: 96, borderRadius: '50%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textAlign: 'center', gap: 5,
        background: s.bg, border: `2px solid ${s.border}`, color: s.color,
        animation: cls === 'proc' ? 'gy 2.5s infinite' : 'none',
      }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        {label}
      </div>
      <div style={{ fontSize: 10, color: 'var(--txt3)', textAlign: 'center' }}>{sub}</div>
    </div>
  )
}

function Arrow() {
  return <div style={{ padding: '0 14px', color: 'var(--txt3)', fontSize: 22 }}>→</div>
}

function InfoBox({ color, title, body }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 15 }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.65 }}>{body}</div>
    </div>
  )
}
