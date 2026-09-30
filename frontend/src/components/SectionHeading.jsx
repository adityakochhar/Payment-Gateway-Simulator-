// Big serif heading with one orange italic word, and a short explanation on the right.
// Example: <SectionHeading title="How it" accent="works">Three steps...</SectionHeading>
export default function SectionHeading({ title, accent, children }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <h2 className="font-serif text-4xl leading-none md:text-5xl">
        {title} <em className="text-accent">{accent}</em>
      </h2>
      <p className="max-w-sm text-muted">{children}</p>
    </div>
  )
}
