// All calls to the backend live in this one file.
//
// The backend address comes from the .env files:
//   npm run dev   -> .env.development -> http://localhost:8080
//   npm run build -> .env.production  -> the Render URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Render's free plan sleeps when nobody uses it, and waking up can take ~50 seconds
const TIMEOUT_MS = 60000

async function request(path, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response
  try {
    response = await fetch(API_URL + path, { ...options, signal: controller.signal })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The server took too long to respond. Please try again.')
    }
    throw new Error('Cannot reach the server. Is the backend running?')
  } finally {
    clearTimeout(timer)
  }

  // Read the body as text first - error pages are not always JSON
  const text = await response.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch (e) {
    data = null
  }

  if (!response.ok) {
    let message = 'Server error (' + response.status + ')'
    if (data && data.error) {
      message = data.error
    }
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return data
}

export function initiatePayment(idempotencyKey, amount) {
  return request('/api/payments/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idempotencyKey: idempotencyKey, amount: amount }),
  })
}

export function getPayment(transactionId) {
  return request('/api/payments/' + encodeURIComponent(transactionId))
}

export function getStats() {
  return request('/api/payments/stats')
}
