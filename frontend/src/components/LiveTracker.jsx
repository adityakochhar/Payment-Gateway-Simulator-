import { useState } from 'react'
import { formatAmount, formatDate, isPending, shortId } from '../utils'
import CardTitle from './CardTitle'
import StatusBadge from './StatusBadge'
import Timeline from './Timeline'
import LookupForm from './LookupForm'

// Card 2: shows the selected payment step by step.
// App keeps "transaction" fresh by asking the backend every 3 seconds while it is in progress.
export default function LiveTracker({ transaction, onTransactionLoaded }) {
  return (
    <div className="flex flex-col rounded-3xl border border-line bg-white p-6 md:p-7">
      <CardTitle number="2" title="Watch it live" note="GET /api/payments/{id}" />

      {transaction ? <TrackerContent transaction={transaction} /> : <EmptyTracker />}

      <LookupForm onTransactionLoaded={onTransactionLoaded} />
    </div>
  )
}

function TrackerContent({ transaction }) {
  return (
    <div className="flex-1">
      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-serif text-4xl leading-none">{formatAmount(transaction.amount)}</p>
          <p className="mt-2 font-mono text-xs text-muted">Payment {shortId(transaction.id)}</p>
        </div>
        <StatusBadge status={transaction.status} />
      </div>

      {isPending(transaction) && (
        <p className="mt-3 text-xs text-amber-700">Updating by itself every 3 seconds…</p>
      )}

      <Timeline payment={transaction} />
      <Details transaction={transaction} />
    </div>
  )
}

function EmptyTracker() {
  return (
    <div className="my-6 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      <p className="font-serif text-3xl">Nothing to track yet</p>
      <p className="mt-2 max-w-xs text-sm text-muted">
        Make a payment on the left, or look one up by its ID below. Its journey will appear here.
      </p>
    </div>
  )
}

function Details({ transaction }) {
  const [copied, setCopied] = useState(false)

  function copyId() {
    navigator.clipboard.writeText(transaction.id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="border-t border-dashed border-line pt-5">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
        <Detail label="Status" value={transaction.status} />
        <Detail label="Retries" value={transaction.retryCount + ' of 3'} />
        <Detail label="Version" value={transaction.version} />
        <Detail label="Created" value={formatDate(transaction.createdAt)} />
        <Detail label="Last update" value={formatDate(transaction.updatedAt)} />
        <Detail label="Order ID" value={shortId(transaction.idempotencyKey)} />
      </dl>
      <p className="mt-3 text-xs text-muted">Version goes up by 1 every time this payment is saved.</p>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-paper px-3 py-2">
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-soft">{transaction.id}</span>
        <button onClick={copyId} className="shrink-0 text-xs font-medium hover:text-accent">
          {copied ? 'Copied ✓' : 'Copy ID'}
        </button>
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  )
}
