// Pixel sword underline echoing the box-art logo. Purely decorative; the
// `decor` appearance tweak hides it in "minimal" mode (see index.css).
export function SwordDivider() {
  return (
    <div className="sword-divider" aria-hidden="true">
      <span className="pommel" />
      <span className="grip" />
      <span className="guard" />
      <span className="blade" />
    </div>
  )
}
