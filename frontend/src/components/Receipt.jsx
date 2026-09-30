import { STATUS, formatAmount, formatTime, shortId } from '../utils'

// Paper receipt in the hero. Shows the latest payment made in this browser.
export default function Receipt({ transaction }) {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="receipt-edge rotate-2 rounded-t-md bg-white px-7 pb-10 pt-7 shadow-xl shadow-amber-900/10">
        {transaction ? <ReceiptContent transaction={transaction} /> : <EmptyReceipt />}
      </div>

      <div className="absolute -bottom-20 -left-6 w-48 -rotate-3 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900 shadow-lg shadow-amber-900/10">
        <p className="font-serif text-lg leading-tight">Sent it twice?</p>
        Same order ID = same payment. You're never charged twice.
      </div>
    </div>
  )
}

function ReceiptContent({ transaction }) {
  const style = STATUS[transaction.status] || STATUS.INITIATED

  return (
    <>
      <div className="flex justify-between text-xs uppercase tracking-widest text-muted">
        <span>Latest payment</span>
        <span>#{shortId(transaction.id)}</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="font-serif text-5xl">{formatAmount(transaction.amount)}</p>
        {/* The rubber stamp */}
        <span className={'-rotate-12 rounded-lg border-2 px-3 py-1 font-semibold tracking-widest ' + style.stamp}>
          {style.label.toUpperCase()}
        </span>
      </div>

      <hr className="my-5 border-dashed border-line" />

      <Row label="Created" value={formatTime(transaction.createdAt)} />
      <Row label="Retries" value={transaction.retryCount + ' of 3'} />
      <Row label="Status" value={transaction.status} />
      <Row label="Last update" value={formatTime(transaction.updatedAt)} />
    </>
  )
}

function EmptyReceipt() {
  return (
    <>
      <div className="text-xs uppercase tracking-widest text-muted">Receipt</div>
      <p className="mt-5 font-serif text-4xl">No payments yet</p>
      <p className="mt-2 text-sm text-muted">Make one below. Your latest payment will show up here.</p>
      <hr className="my-5 border-dashed border-line" />
      <Row label="Created" value="—" />
      <Row label="Status" value="—" />
    </>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  )
}
