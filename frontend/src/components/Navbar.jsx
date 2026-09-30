// The black circle with an orange dot
export function Logo() {
  return (
    <span className="relative inline-block h-6 w-6 rounded-full bg-ink">
      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-accent" />
    </span>
  )
}

// apiOnline: null = still checking, true = backend answered, false = backend unreachable
export default function Navbar({ apiOnline }) {
  let dotColor = 'bg-muted'
  let label = 'Connecting…'
  if (apiOnline === true) {
    dotColor = 'bg-emerald-500'
    label = 'Server online'
  } else if (apiOnline === false) {
    dotColor = 'bg-red-500'
    label = 'Server offline'
  }

  return (
    <nav className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
        <a href="#top" className="flex items-center gap-2.5 font-semibold">
          <Logo />
          PayGateway
        </a>

        <div className="hidden gap-7 text-sm text-muted md:flex">
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#try" className="hover:text-ink">Try it</a>
          <a href="#payments" className="hover:text-ink">Your payments</a>
        </div>

        <div className="ml-auto flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm">
          <span className={'h-2 w-2 rounded-full ' + dotColor} />
          {label}
        </div>
      </div>
    </nav>
  )
}
