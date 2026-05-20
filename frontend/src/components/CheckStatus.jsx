import { useState } from 'react'
import ResultPanel, { ErrorPanel, Spinner } from './ResultPanel'

export default function CheckStatus({ apiBase, txIdInput, setTxIdInput, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')

  async function check() {
    setResult(null); setError('')
    if (!txIdInput.trim()) return setError('Please enter a transaction ID.')
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/payments/${encodeURIComponent(txIdInput.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Transaction not found')
      setResult(data)
      onUpdate(data)
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
        <div style={{ ...ciStyle, background: 'rgba(155,111,245,.1)', border: '1px solid rgba(155,111,245,.25)' }}>🔍</div>
        <div>
          <div style={ctStyle}>Check Transaction Status</div>
          <div style={csStyle}>GET /api/payments/{'{id}'} · real-time state</div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Transaction ID</label>
        <input
          type="text"
          value={txIdInput}
          onChange={e => setTxIdInput(e.target.value)}
          placeholder="Auto-filled after payment — or paste a transaction ID"
        />
      </div>

      <button onClick={check} disabled={loading} style={purpleBtn}>
        {loading ? <><Spinner />Fetching…</> : 'Check Status →'}
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
const purpleBtn = {
  width: '100%', border: 'none', borderRadius: 10, padding: 12,
  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  background: 'linear-gradient(135deg, #6b42d4, #9b6ff5)',
  color: '#fff', boxShadow: '0 4px 18px rgba(155,111,245,.22)', marginTop: 14,
}
