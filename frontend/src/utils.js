// Small helpers shared by several components

// How each status looks on screen. "label" is the friendly word shown to users.
export const STATUS = {
  INITIATED: {
    label: 'Created',
    badge: 'bg-blue-50 text-blue-700',
    dot: 'bg-blue-600',
    stamp: 'border-blue-600 text-blue-600',
  },
  PROCESSING: {
    label: 'In progress',
    badge: 'bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
    stamp: 'border-amber-500 text-amber-600',
  },
  SUCCESS: {
    label: 'Paid',
    badge: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-600',
    stamp: 'border-emerald-600 text-emerald-600',
  },
  FAILED: {
    label: 'Failed',
    badge: 'bg-red-50 text-red-700',
    dot: 'bg-red-600',
    stamp: 'border-red-600 text-red-600',
  },
}

// A payment is "pending" until it reaches SUCCESS or FAILED
export function isPending(transaction) {
  return transaction.status === 'INITIATED' || transaction.status === 'PROCESSING'
}

// "2026-09-30T11:34:24Z" -> "30/09/26, 5:04:24 pm" (in the user's own time zone)
export function formatDate(value) {
  if (!value) {
    return '—'
  }
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })
}

// "2026-09-30T11:34:24Z" -> "5:04:24 pm"
export function formatTime(value) {
  if (!value) {
    return ''
  }
  return new Date(value).toLocaleTimeString('en-IN', { timeStyle: 'medium' })
}

// 10000 -> "₹10,000.00"
export function formatAmount(amount) {
  const number = Number(amount)
  return '₹' + number.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// "dbf7cf99-0311-4669-a038-26bab3d66d3a" -> "dbf7cf99"
export function shortId(id) {
  if (!id) {
    return '—'
  }
  return id.slice(0, 8)
}

// Payment history is kept in the browser so it survives a page refresh
const HISTORY_KEY = 'txLog'
export const HISTORY_LIMIT = 50

export function loadHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY)
    return saved ? JSON.parse(saved) : []
  } catch (e) {
    return []
  }
}

export function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch (e) {
    // Storage can be full or blocked (private mode) - the app still works without it
  }
}
