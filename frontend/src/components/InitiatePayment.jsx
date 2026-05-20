import { useState } from 'react'
import ResultPanel, { ErrorPanel, Spinner } from './ResultPanel'

export default function InitiatePayment({ apiBase, onSuccess }) {
  const [key, setKey]     = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')

  function genKey() { setKey(crypto.randomUUID()) }

  async function submit() {
    setResult(null); setError('')
    if (!key.trim()) return setError('Please enter or generate an idempotency key.')
    if (!amount || parseFloat(amount) <= 0) return setError('Please enter a valid amount greater than 0.')
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/payments/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idempotencyKey: key.trim(), amount: parseFloat(amount) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setResult(data)
      onSuccess(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={cardStyle}>
      <div style={accentBar} />
      <div style={chStyle}>
        <div style={{ ...ciStyle, background: 'var(--blue-dim)', border: '1px solid rgba(59,142,240,.25)' }}>💳</div>
        <div>
          <div style={ctStyle}>Initiate Payment</div>
          <div style={csStyle}>POST /api/payments/initiate · idempotent</div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Idempotency Key</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={key} onChange={e => setKey(e.target.value)}
            placeholder="UUID — uniquely identifies this payment" />
          <button onClick={genKey} style={ghostBtn}>Generate</button>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Amount (₹ INR)</label>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="e.g. 499.99" step="0.01" min="0.01" />
      </div>

      <button onClick={submit} disabled={loading} style={blueBtn}>
        {loading ? <><Spinner />Processing…</> : 'Initiate Payment →'}
      </button>

      <ResultPanel tx={result} />
      <ErrorPanel msg={error} />
    </div>
  )
}

const cardStyle = {
  background: 'var(--card)', border: '1px solid var(--border)',
  borderRadius: 14, padding: 26, position: 'relative', overflow: 'hidden',
}
const accentBar = {
  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
  background: 'linear-gradient(90deg, var(--blue), var(--purple))',
}
const chStyle = { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }
const ciStyle = { width: 36, height: 36, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }
const ctStyle = { fontSize: 14, fontWeight: 600 }
const csStyle = { fontSize: 12, color: 'var(--txt2)', marginTop: 2 }
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--txt2)', marginBottom: 6 }
const ghostBtn = {
  background: 'rgba(59,142,240,.1)', color: '#6ab3f8', border: '1px solid rgba(59,142,240,.25)',
  borderRadius: 8, padding: '0 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
  whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0,
}
const blueBtn = {
  width: '100%', border: 'none', borderRadius: 10, padding: 12,
  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  background: 'linear-gradient(135deg, #2478e4, #7c5fe0)',
  color: '#fff', boxShadow: '0 4px 18px rgba(59,142,240,.22)', marginTop: 4,
}
