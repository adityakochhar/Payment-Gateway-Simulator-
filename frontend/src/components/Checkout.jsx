import { useEffect, useState } from 'react'
import { initiatePayment } from '../api'
import { formatAmount } from '../utils'
import CardTitle from './CardTitle'
import ErrorMessage from './ErrorMessage'
import Spinner from './Spinner'

const QUICK_AMOUNTS = [99, 499, 1999, 10000]

// Card 1: choose an amount and an order ID, then press Pay.
// orderId and amount live in App, so the "Things to try" buttons can fill them in.
export default function Checkout({ orderId, setOrderId, amount, setAmount, onPaymentCreated }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // The form changed (typed, or filled in by "Things to try") - the old error no longer applies
  useEffect(() => {
    setError('')
  }, [orderId, amount])

  async function handlePay() {
    setError('')

    if (orderId.trim() === '') {
      setError('Please enter an order ID, or press "New ID".')
      return
    }
    if (amount === '' || Number(amount) <= 0) {
      setError('Please enter an amount greater than 0.')
      return
    }

    setLoading(true)
    try {
      const payment = await initiatePayment(orderId.trim(), Number(amount))
      onPaymentCreated(payment)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  let buttonText = 'Pay →'
  if (amount !== '' && Number(amount) > 0) {
    buttonText = 'Pay ' + formatAmount(amount) + ' →'
  }

  return (
    <div className="rounded-3xl border border-line bg-white p-6 md:p-7">
      <CardTitle number="1" title="Make a payment" note="POST /api/payments/initiate" />

      {/* Amount */}
      <label className="mt-6 block rounded-2xl border border-line bg-paper/50 px-5 py-4 focus-within:border-ink">
        <span className="text-sm text-muted">Amount</span>
        <span className="flex items-baseline gap-2">
          <span className="font-serif text-4xl text-muted">₹</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent font-serif text-6xl outline-none placeholder:text-line"
          />
        </span>
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((value) => {
          const selected = Number(amount) === value
          return (
            <button
              key={value}
              onClick={() => setAmount(String(value))}
              className={
                'rounded-full border px-3 py-1.5 text-sm ' +
                (selected ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink')
              }
            >
              ₹{value.toLocaleString('en-IN')}
            </button>
          )
        })}
      </div>

      {/* Order ID */}
      <div className="mt-6">
        <p className="mb-2 text-sm text-muted">
          Order ID <span className="text-xs">(idempotency key)</span>
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-line py-1.5 pl-3 pr-1.5 focus-within:border-ink">
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Type an ID or press New ID"
            className="min-w-0 flex-1 font-mono text-sm outline-none"
          />
          <button
            onClick={() => setOrderId(crypto.randomUUID())}
            className="shrink-0 rounded-lg bg-paper px-3 py-1.5 text-sm hover:bg-line"
          >
            ↻ New ID
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">
          One order ID = one payment. Press Pay again with the same ID and you get the same payment
          back. For a new payment, press <b className="font-medium text-ink">New ID</b> first.
        </p>
      </div>

      <button
        onClick={handlePay}
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 text-lg font-medium text-white hover:bg-ink-soft disabled:opacity-60"
      >
        {loading ? <><Spinner /> Sending…</> : buttonText}
      </button>

      <ErrorMessage message={error} />
      <p className="mt-3 text-center text-xs text-muted">Pretend money · nothing is really charged</p>
    </div>
  )
}
