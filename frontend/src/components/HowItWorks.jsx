import SectionHeading from './SectionHeading'

const STEPS = [
  {
    title: 'You create a payment',
    text: 'Pick an amount and press Pay. Each payment has an order ID. Send the same ID twice and you get the same payment back — never a second charge.',
  },
  {
    title: 'A pretend bank answers',
    text: 'The server plays the bank and says yes about 7 times in 10. If it says no, a background job tries again up to 3 times, waiting a little longer each time.',
  },
  {
    title: 'It ends as paid or failed',
    text: 'The result is saved in MySQL and a webhook message is written to the server log (a real gateway would send it to the shop). Any payment can be looked up by its ID.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16">
      <SectionHeading title="How it" accent="works">
        Three things happen every time someone pays online. This site lets you watch all three.
      </SectionHeading>

      <div className="grid border-t border-ink md:grid-cols-3 md:divide-x md:divide-line">
        {STEPS.map((step, index) => (
          <div key={step.title} className="py-7 md:px-7 md:first:pl-0">
            <p className="font-mono text-sm text-accent">0{index + 1}</p>
            <h3 className="mt-3 text-xl font-medium">{step.title}</h3>
            <p className="mt-2 text-ink-soft">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
