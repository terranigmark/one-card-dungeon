import { useLog } from '../../state/hooks'
import { useT } from '../../i18n'
import { formatLog } from '../../i18n/strings'

export function ActionLog() {
  const log = useLog()
  const t = useT()
  // Newest first; CSS column-reverse renders it at the bottom and keeps it in view.
  const entries = [...log].reverse()
  return (
    <div className="panel">
      <h3>{t.log.heading}</h3>
      <div className="log">
        {entries.map((e, i) => (
          <div key={log.length - i} className={`entry ${e.t === 'levelStart' ? 'level' : ''}`}>
            {formatLog(e, t)}
          </div>
        ))}
      </div>
    </div>
  )
}
