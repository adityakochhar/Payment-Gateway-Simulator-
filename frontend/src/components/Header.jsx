export default function Header({ connected }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(8,13,24,.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '0 36px', height: 60,
    }}>
      <div style={{
        width: 38, height: 38, flexShrink: 0,
        background: 'linear-gradient(135deg, var(--blue), var(--purple))',
        borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, boxShadow: '0 0 24px rgba(59,142,240,.35)',
      }}>⚡</div>
      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.01em' }}>PayGateway Simulator</div>
      <div style={{ flex: 1 }} />
      <div style={{
        fontSize: 11, color: 'var(--txt2)', background: 'var(--bg3)',
        border: '1px solid var(--border)', padding: '3px 11px', borderRadius: 20,
      }}>Java · Spring Boot · MySQL · Redis</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 11, color: 'var(--txt2)', background: 'var(--bg3)',
        border: '1px solid var(--border)', padding: '4px 12px', borderRadius: 20,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: connected ? 'var(--green)' : 'var(--txt3)',
          boxShadow: connected ? '0 0 6px var(--green)' : 'none',
          animation: connected ? 'blink 2s ease-in-out infinite' : 'none',
          display: 'inline-block',
        }} />
        {connected ? 'API Live' : 'Not connected'}
      </div>
    </header>
  )
}
