import SectionHeading from './SectionHeading'

const EXPERIMENTS = [
  {
    number: 1,
    title: 'Pay twice by accident',
    text: 'Fills in your last order ID and amount. Press Pay: the server recognises the ID and returns the same payment instead of charging again.',
    result: 'Same payment ID comes back',
    needsPayment: true,
  },
  {
    number: 2,
    title: 'Same ID, new amount',
    text: 'Fills in your last order ID with ₹100 more. A buggy shop might do this. Press Pay: the server refuses, because one ID must mean one amount.',
    result: 'Error: ID already used',
    needsPayment: true,
  },
  {
    number: 3,
    title: 'Watch a retry happen',
    text: 'Makes a fresh order ID. About 3 in 10 payments fail on the first try. Keep paying (press New ID each time) until the tracker shows "Retrying".',
    result: 'It retries by itself',
    needsPayment: false,
  },
]

// onSetup(number) fills in the checkout form for that experiment and scrolls to it
export default function Experiments({ hasPayment, onSetup }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeading title="Things" accent="to try">
        Each one shows a problem real payment systems have to solve. The button fills in the form for you.
      </SectionHeading>

      <div className="grid gap-4 md:grid-cols-3">
        {EXPERIMENTS.map((experiment) => {
          const disabled = experiment.needsPayment && !hasPayment
          return (
            <div key={experiment.number} className="flex flex-col rounded-3xl border border-line bg-white p-6">
              <p className="font-mono text-xs text-muted">Experiment 0{experiment.number}</p>
              <h3 className="mt-3 text-lg font-medium">{experiment.title}</h3>
              <p className="mt-2 flex-1 text-sm text-ink-soft">{experiment.text}</p>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
                <span className="text-muted">{experiment.result}</span>
                <button
                  onClick={() => onSetup(experiment.number)}
                  disabled={disabled}
                  className="shrink-0 font-medium hover:text-accent disabled:text-muted"
                >
                  {disabled ? 'Make a payment first' : 'Set it up →'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
