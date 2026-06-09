// Fixed top-right gear that opens the settings drawer. Used on screens that
// have no topbar of their own (title / class-select), so the settings
// affordance sits in the same corner everywhere.
export function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="settings-fab" aria-label="Settings" onClick={onClick}>
      ⚙
    </button>
  )
}
