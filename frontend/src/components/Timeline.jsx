import { formatTime } from '../utils'

/*
  Turns one payment into a list of steps for the tracker.
  It only uses real data from the backend: status, retryCount, createdAt, updatedAt.

  Each step has a "state":
    done   = finished fine        warn = the bank said no
    failed = ended in failure     now  = happening right now
    todo   = not reached yet
*/
function buildSteps(payment) {
  const status = payment.status
  const retries = payment.retryCount
  const steps = []

  // 1. Created
  steps.push({ title: 'Payment created', text: 'Saved in the MySQL database.', state: 'done', time: payment.createdAt })

  // 2. First try at the pretend bank
  if (status === 'INITIATED') {
    steps.push({ title: 'First try', text: 'Sending to the pretend bank…', state: 'now' })
  } else if (status === 'SUCCESS' && retries === 0) {
    steps.push({ title: 'First try', text: 'The pretend bank said yes.', state: 'done' })
  } else {
    steps.push({ title: 'First try', text: 'The pretend bank said no. This happens about 3 times in 10.', state: 'warn' })
  }

  // 3. Retries - only when the first try failed
  if (status === 'PROCESSING') {
    steps.push({
      title: 'Retrying',
      text: 'Waiting for retry ' + (retries + 1) + ' of 3. The retry job waits longer each time (2s, 4s, 8s).',
      state: 'now',
      attempts: retries,
    })
  } else if (status === 'SUCCESS' && retries > 0) {
    steps.push({ title: 'Retried', text: 'It worked on retry ' + retries + ' of 3.', state: 'done', attempts: retries })
  } else if (status === 'FAILED') {
    steps.push({ title: 'Retried', text: 'All 3 retries failed.', state: 'failed', attempts: retries })
  }

  // 4. Final result
  const webhookNote = 'Final. A webhook message was written to the server log.'
  if (status === 'SUCCESS') {
    steps.push({ title: 'Paid', text: webhookNote, state: 'done', time: payment.updatedAt })
  } else if (status === 'FAILED') {
    steps.push({ title: 'Failed', text: webhookNote, state: 'failed', time: payment.updatedAt })
  } else {
    steps.push({ title: 'Paid or failed', text: 'Not decided yet…', state: 'todo' })
  }

  return steps
}

export default function Timeline({ payment }) {
  const steps = buildSteps(payment)

  return (
    <ol className="mt-6">
      {steps.map((step, index) => (
        <TimelineStep key={step.title} step={step} isLast={index === steps.length - 1} />
      ))}
    </ol>
  )
}

function TimelineStep({ step, isLast }) {
  const lineColor = step.state === 'done' || step.state === 'warn' ? 'bg-ink' : 'bg-line'

  return (
    <li className="flex gap-4">
      <div className="flex flex-col items-center">
        <StepIcon state={step.state} />
        {!isLast && <div className={'my-1 w-0.5 flex-1 ' + lineColor} />}
      </div>

      <div className="flex-1 pb-6">
        <div className="flex items-baseline justify-between gap-4">
          <p className={'font-medium ' + (step.state === 'todo' ? 'text-muted' : '')}>{step.title}</p>
          <span className="font-mono text-xs text-muted">{formatTime(step.time)}</span>
        </div>
        <p className="mt-0.5 text-sm text-muted">{step.text}</p>
        {step.attempts !== undefined && <AttemptsBar used={step.attempts} waiting={step.state === 'now'} />}
      </div>
    </li>
  )
}

const ICON = 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm'

function StepIcon({ state }) {
  if (state === 'done') {
    return <span className={ICON + ' bg-ink text-white'}>✓</span>
  }
  if (state === 'warn') {
    return <span className={ICON + ' border-2 border-amber-500 bg-amber-50 font-semibold text-amber-700'}>!</span>
  }
  if (state === 'failed') {
    return <span className={ICON + ' bg-red-600 text-white'}>✕</span>
  }
  if (state === 'now') {
    return (
      <span className={ICON + ' relative border-2 border-amber-500 bg-white'}>
        <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-30" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
      </span>
    )
  }
  return <span className={ICON + ' border-2 border-line bg-white'} />
}

// Three small bars: one for each retry (3 at most)
function AttemptsBar({ used, waiting }) {
  return (
    <div className="mt-2 flex gap-1.5">
      {[1, 2, 3].map((number) => {
        let color = 'bg-line'
        if (number <= used) {
          color = 'bg-amber-500'
        } else if (number === used + 1 && waiting) {
          color = 'animate-pulse bg-amber-300'
        }
        return <span key={number} className={'h-1.5 w-10 rounded-full ' + color} />
      })}
    </div>
  )
}
