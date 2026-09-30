import Receipt from './Receipt'

// Top of the page: headline, buttons, live numbers and the receipt
export default function Hero({ stats, latestPayment }) {
  const s = stats || {}

  const numbers = [
    { label: 'payments', value: s.total, dot: '' },
    { label: 'paid', value: s.success, dot: 'bg-emerald-600' },
    { label: 'in progress', value: s.processing, dot: 'bg-amber-500' },
    { label: 'failed', value: s.failed, dot: 'bg-red-600' },
  ]

  return (
    <header id="top" className="mx-auto grid max-w-6xl items-center gap-20 px-6 py-16 md:py-24 lg:grid-cols-2">
      <div>
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-sm text-ink-soft">
          <span className="h-2 w-2 rounded-full bg-accent" />
          Payment gateway simulator
        </p>

        <h1 className="font-serif text-6xl leading-none md:text-7xl">
          Watch a payment
          <br />
          <em className="text-accent">find its way.</em>
        </h1>

        <p className="mt-6 max-w-md text-lg text-ink-soft">
          Send a pretend payment and follow every step: saved, sent to a pretend bank, retried if it
          fails, and finished as paid or failed. No real money is used.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#try" className="rounded-full bg-ink px-6 py-3 font-medium text-white hover:bg-ink-soft">
            Make a payment ↓
          </a>
          <a href="#how" className="rounded-full border border-line px-6 py-3 font-medium hover:bg-white">
            How it works
          </a>
        </div>

        {/* Live numbers from the database */}
        <div className="mt-12 border-t border-line pt-6">
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            {numbers.map((item) => (
              <div key={item.label}>
                <p className="font-serif text-4xl leading-none">{item.value === undefined ? '—' : item.value}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  {item.dot && <span className={'h-1.5 w-1.5 rounded-full ' + item.dot} />}
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">All payments in the database · refreshes every 10 seconds</p>
        </div>
      </div>

      <div className="pb-20">
        <Receipt transaction={latestPayment} />
      </div>
    </header>
  )
}
