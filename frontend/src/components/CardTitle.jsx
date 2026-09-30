// Title row of a card: a numbered circle, a title, and the API call it uses
export default function CardTitle({ number, title, note }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm font-medium text-white">
          {number}
        </span>
        <h3 className="text-lg font-medium">{title}</h3>
      </div>
      <span className="hidden font-mono text-xs text-muted sm:block">{note}</span>
    </div>
  )
}
