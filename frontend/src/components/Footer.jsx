import { Logo } from './Navbar'

const TECH = ['Java 17', 'Spring Boot', 'MySQL', 'Redis', 'React', 'Tailwind']

export default function Footer() {
  return (
    <footer className="border-t border-line py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 text-sm text-muted md:flex-row md:items-center">
        <div className="flex items-center gap-2.5">
          <Logo />
          PayGateway Simulator · a portfolio project
        </div>
        <div className="flex flex-wrap gap-2">
          {TECH.map((name) => (
            <span key={name} className="rounded-full border border-line bg-white px-3 py-1 text-ink-soft">
              {name}
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}
