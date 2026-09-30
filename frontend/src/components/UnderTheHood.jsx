import SectionHeading from './SectionHeading'

// The engineering ideas behind the page, in plain words
const FEATURES = [
  {
    term: 'Idempotency',
    title: 'Never charged twice',
    text: 'Order IDs are remembered in Redis for 24 hours. MySQL also has a UNIQUE rule on the order ID, so even two requests at the exact same moment create only one payment. If Redis is down, MySQL is used instead.',
  },
  {
    term: 'Exponential backoff',
    title: 'Retries that wait longer each time',
    text: 'A scheduled job runs every 5 seconds and retries stuck payments after 2s, then 4s, then 8s. After 3 failed retries the payment is marked FAILED.',
  },
  {
    term: 'Optimistic locking',
    title: 'Safe updates',
    text: 'Every payment has a version number (JPA @Version). If two updates happen at the same time, the second one fails instead of silently overwriting the first.',
  },
  {
    term: 'State machine',
    title: 'Steps in a strict order',
    text: 'INITIATED → PROCESSING → SUCCESS or FAILED. The code refuses to skip a step or go backwards, and SUCCESS / FAILED can never change.',
  },
]

export default function UnderTheHood() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeading title="Under the" accent="hood">
        For the curious: the engineering ideas behind what you just saw.
      </SectionHeading>

      <div className="grid gap-4 md:grid-cols-2">
        {FEATURES.map((feature) => (
          <div key={feature.term} className="rounded-3xl border border-line bg-white p-6">
            <p className="font-mono text-xs text-accent">{feature.term}</p>
            <h3 className="mt-3 text-lg font-medium">{feature.title}</h3>
            <p className="mt-2 text-sm text-ink-soft">{feature.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
