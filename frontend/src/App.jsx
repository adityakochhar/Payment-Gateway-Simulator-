import { useEffect, useRef, useState } from 'react'
import { getPayment, getStats } from './api'
import { isPending, loadHistory, saveHistory, HISTORY_LIMIT } from './utils'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import SectionHeading from './components/SectionHeading'
import Checkout from './components/Checkout'
import LiveTracker from './components/LiveTracker'
import Experiments from './components/Experiments'
import PaymentsList from './components/PaymentsList'
import UnderTheHood from './components/UnderTheHood'
import Footer from './components/Footer'

const STATS_REFRESH_MS = 10000 // refresh the numbers at the top every 10 seconds
const POLL_EVERY_MS = 3000     // check a pending payment every 3 seconds
const MAX_POLLS = 40           // give up after 2 minutes (retries normally finish in ~30s)

export default function App() {
  const [stats, setStats] = useState(null)
  const [apiOnline, setApiOnline] = useState(null) // null = still checking
  const [history, setHistory] = useState(loadHistory)
  const [selectedId, setSelectedId] = useState(null) // the payment shown in the tracker
  const [orderId, setOrderId] = useState(() => crypto.randomUUID())
  const [amount, setAmount] = useState('')
  const watching = useRef(new Set()) // ids we are already polling

  useEffect(() => {
    refreshStats()
    const timer = setInterval(refreshStats, STATS_REFRESH_MS)

    // Keep watching payments that were still pending when the page was last closed
    for (const transaction of loadHistory()) {
      if (isPending(transaction)) {
        watchUntilFinished(transaction.id)
      }
    }

    return () => clearInterval(timer)
  }, [])

  async function refreshStats() {
    try {
      const data = await getStats()
      setStats(data)
      setApiOnline(true)
    } catch (err) {
      setApiOnline(false)
    }
  }

  // Add a payment to the history, or replace the old copy of it
  function saveTransaction(transaction) {
    setHistory((oldHistory) => {
      const alreadyInHistory = oldHistory.some((t) => t.id === transaction.id)

      let newHistory
      if (alreadyInHistory) {
        newHistory = oldHistory.map((t) => (t.id === transaction.id ? transaction : t))
      } else {
        newHistory = [transaction, ...oldHistory].slice(0, HISTORY_LIMIT)
      }

      saveHistory(newHistory)
      return newHistory
    })
  }

  // Ask the backend every few seconds until the payment is SUCCESS or FAILED
  function watchUntilFinished(transactionId) {
    if (watching.current.has(transactionId)) {
      return
    }
    watching.current.add(transactionId)

    let polls = 0
    let busy = false // don't start a new request while the last one is still running

    const timer = setInterval(async () => {
      if (busy) {
        return
      }
      busy = true
      polls = polls + 1

      try {
        const transaction = await getPayment(transactionId)
        saveTransaction(transaction)
        if (!isPending(transaction)) {
          stop()
          refreshStats()
        }
      } catch (err) {
        // 404 means the payment does not exist, so stop.
        // Other errors (like a network hiccup) are ignored - we simply try again next time.
        if (err.status === 404) {
          stop()
        }
      } finally {
        busy = false
      }

      if (polls >= MAX_POLLS) {
        stop()
      }
    }, POLL_EVERY_MS)

    function stop() {
      clearInterval(timer)
      watching.current.delete(transactionId)
    }
  }

  // A payment came back from the server (new, repeated, or looked up): show it in the tracker
  function showInTracker(transaction) {
    saveTransaction(transaction)
    setSelectedId(transaction.id)
    refreshStats()
    if (isPending(transaction)) {
      watchUntilFinished(transaction.id)
    }
  }

  function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' })
  }

  // A row in "Your payments" was clicked
  function handleSelect(transactionId) {
    setSelectedId(transactionId)
    scrollToSection('try')
  }

  // A "Things to try" button was clicked: fill in the checkout form for it
  function handleExperiment(number) {
    const lastPayment = history[0]
    if (number === 1) {
      setOrderId(lastPayment.idempotencyKey)
      setAmount(String(lastPayment.amount))
    } else if (number === 2) {
      setOrderId(lastPayment.idempotencyKey)
      setAmount(String(Number(lastPayment.amount) + 100))
    } else {
      setOrderId(crypto.randomUUID())
    }
    scrollToSection('try')
  }

  const selectedPayment = history.find((t) => t.id === selectedId) || null

  return (
    <>
      <Navbar apiOnline={apiOnline} />

      <main>
        <Hero stats={stats} latestPayment={history[0] || null} />
        <HowItWorks />

        <section id="try" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16">
          <SectionHeading title="Try it" accent="yourself">
            Fill in an amount and press Pay. The tracker follows the payment by itself — no refreshing.
          </SectionHeading>

          <div className="grid items-start gap-5 lg:grid-cols-2">
            <Checkout
              orderId={orderId}
              setOrderId={setOrderId}
              amount={amount}
              setAmount={setAmount}
              onPaymentCreated={showInTracker}
            />
            <LiveTracker transaction={selectedPayment} onTransactionLoaded={showInTracker} />
          </div>
        </section>

        <Experiments hasPayment={history.length > 0} onSetup={handleExperiment} />
        <PaymentsList history={history} selectedId={selectedId} onSelect={handleSelect} />
        <UnderTheHood />
      </main>

      <Footer />
    </>
  )
}
