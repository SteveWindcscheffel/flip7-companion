const WORDMARK_LAYERS = ['keyline', 'inline-dark', 'inline-light', 'fill'] as const

/**
 * The FLIP7 wordmark, built as four stacked, absolutely-positioned copies of
 * the same markup using different -webkit-text-stroke widths/colours, per
 * README.md "Logo lockup". Pure CSS type — no image asset.
 */
function Wordmark() {
  return (
    <div className="f7-wordmark" aria-hidden="true">
      {WORDMARK_LAYERS.map((layer) => (
        <div key={layer} className={`f7-wordmark__layer f7-wordmark__layer--${layer}`}>
          <span>FLIP</span>
          <span>7</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Full home-screen logo lockup: gold rule, four-layer wordmark, COMPANION
 * plate. Rotated slightly and gently bobbing per the design spec.
 */
export function BrandLockup() {
  return (
    <div className="f7-home-logo" role="img" aria-label="Flip7 Companion">
      <div className="f7-home-logo__rule" />
      <Wordmark />
      <div className="plaque f7-companion-plate">COMPANION</div>
    </div>
  )
}

export default BrandLockup
