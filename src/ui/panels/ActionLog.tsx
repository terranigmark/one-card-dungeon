import { useLog } from '../../state/hooks'

export function ActionLog() {
  const log = useLog()
  // Newest first; CSS column-reverse renders it at the bottom and keeps it in view.
  const entries = [...log].reverse()
  return (
    <div className="panel">
      <h3>Log</h3>
      <div className="log">
        {entries.map((e, i) => (
          <div key={log.length - i} className={`entry ${e.startsWith('—') ? 'level' : ''}`}>
            {e}
          </div>
        ))}
      </div>
    </div>
  )
}
