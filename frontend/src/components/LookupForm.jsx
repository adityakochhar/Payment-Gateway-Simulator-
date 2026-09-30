import { useState } from 'react'
import { getPayment } from '../api'
import ErrorMessage from './ErrorMessage'

// "Have a payment ID? Look it up." - calls GET /api/payments/{id}
export default function LookupForm({ onTransactionLoaded }) {
  const [paymentId, setPaymentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFind(event) {
    event.preventDefault() // stop the browser from reloading the page
    setError('')

    if (paymentId.trim() === '') {
      setError('Please paste a payment ID.')
      return
    }

    setLoading(true)
    try {
      const payment = await getPayment(paymentId.trim())
      onTransactionLoaded(payment)
      setPaymentId('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleFind} className="mt-6 border-t border-line pt-5">
      <label className="text-sm text-muted">Have a payment ID? Look it up.</label>
      <div className="mt-2 flex gap-2">
        <input
          value={paymentId}
          onChange={(e) => {
            setPaymentId(e.target.value)
            setError('')
          }}
          placeholder="Paste a payment ID"
          className="min-w-0 flex-1 rounded-full border border-line px-4 py-2.5 font-mono text-sm outline-none focus:border-ink"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {loading ? 'Finding…' : 'Find'}
        </button>
      </div>
      <ErrorMessage message={error} />
    </form>
  )
}
