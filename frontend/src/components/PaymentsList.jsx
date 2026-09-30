import { formatAmount, formatDate, shortId } from '../utils'
import SectionHeading from './SectionHeading'
import StatusBadge from './StatusBadge'

// Payments made (or looked up) in this browser. Clicking a row shows it in the tracker.
export default function PaymentsList({ history, selectedId, onSelect }) {
  let content
  if (history.length === 0) {
    content = <p className="px-6 py-12 text-center text-muted">No payments yet — make one above.</p>
  } else {
    content = (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-paper/60 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="py-3 font-medium">Payment ID</th>
              <th className="py-3 font-medium">Created</th>
              <th className="py-3 font-medium">Retries</th>
              <th className="px-6 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {history.map((payment) => (
              <tr
                key={payment.id}
                onClick={() => onSelect(payment.id)}
                className={
                  'cursor-pointer border-t border-line hover:bg-paper/60 ' +
                  (payment.id === selectedId ? 'bg-amber-50/70' : '')
                }
              >
                <td className="px-6 py-4">
                  <StatusBadge status={payment.status} />
                </td>
                <td className="font-mono text-ink-soft">{shortId(payment.id)}…</td>
                <td className="text-muted">{formatDate(payment.createdAt)}</td>
                <td className="text-muted">{payment.retryCount} of 3</td>
                <td className="px-6 text-right font-medium">{formatAmount(payment.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <section id="payments" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16">
      <SectionHeading title="Your" accent="payments">
        Payments made or looked up in this browser (the last 50). Click one to see it in the tracker.
      </SectionHeading>
      <div className="overflow-hidden rounded-3xl border border-line bg-white">{content}</div>
    </section>
  )
}
