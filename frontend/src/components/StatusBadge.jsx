import { STATUS } from '../utils'

// A small colored pill like "● Paid". The dot pulses while the payment is in progress.
export default function StatusBadge({ status }) {
  const style = STATUS[status] || STATUS.INITIATED
  const isLive = status === 'INITIATED' || status === 'PROCESSING'

  return (
    <span className={'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ' + style.badge}>
      <span className={'h-2 w-2 rounded-full ' + style.dot + (isLive ? ' animate-pulse' : '')} />
      {style.label}
    </span>
  )
}
