import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import StatsBar from './components/StatsBar'
import InitiatePayment from './components/InitiatePayment'
import CheckStatus from './components/CheckStatus'
import StateMachine from './components/StateMachine'
import TransactionLog from './components/TransactionLog'

const RENDER_URL = 'https://payment-gateway-simulator-backend.onrender.com'

export default function App() {
  const [stats, setStats]   = useState(null)
  const [txList, setTxList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('txLog') || '[]') } catch { return [] }
  })
  const [txIdInput, setTxIdInput] = useState('')
  const pollingRef = useRef(new Set())

  useEffect(() => {
    fetchStats()
    const id = setInterval(fetchStats, 10000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    txList
      .filter(t => t.status === 'PROCESSING' || t.status === 'INITIATED')
      .forEach(t => startPolling(t.id))
  }, [])

  async function fetchStats() {
    try {
      const r = await fetch(`${RENDER_URL}/api/payments/stats`)
      if (!r.ok) return
      setStats(await r.json())
    } catch (_) {}
  }

  function addToLog(tx) {
    setTxList(prev => {
      const next = [tx, ...prev.filter(t => t.id !== tx.id)].slice(0, 50)
      localStorage.setItem('txLog', JSON.stringify(next))
      return next
    })
  }

  function updateLog(tx) {
    setTxList(prev => {
      const next = prev.map(t => t.id === tx.id ? tx : t)
      localStorage.setItem('txLog', JSON.stringify(next))
      return next
    })
  }

  function startPolling(txId) {
    if (pollingRef.current.has(txId)) return
    pollingRef.current.add(txId)
    const timer = setInterval(async () => {
      try {
        const r = await fetch(`${RENDER_URL}/api/payments/${encodeURIComponent(txId)}`)
        const data = await r.json()
        if (!r.ok) { stop(); return }
        updateLog(data)
        if (data.status !== 'PROCESSING' && data.status !== 'INITIATED') { stop(); fetchStats() }
      } catch (_) { stop() }
      function stop() { clearInterval(timer); pollingRef.current.delete(txId) }
    }, 3000)
  }

  return (
    <>
      <Header connected={true} />
      <StatsBar stats={stats} />
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <InitiatePayment
            apiBase={RENDER_URL}
            onSuccess={tx => { addToLog(tx); fetchStats(); setTxIdInput(tx.id); startPolling(tx.id) }}
          />
          <CheckStatus
            apiBase={RENDER_URL}
            txIdInput={txIdInput}
            setTxIdInput={setTxIdInput}
            onUpdate={tx => { updateLog(tx); fetchStats() }}
          />
        </div>
        <StateMachine />
        <TransactionLog txList={txList} onSelect={id => setTxIdInput(id)} />
      </div>
    </>
  )
}
