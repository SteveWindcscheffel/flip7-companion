interface BrandMarkProps {
  titleId: string
}

export function BrandMark({ titleId }: BrandMarkProps) {
  return (
    <div className="brand-mark" aria-hidden="false">
      <div className="brand-mark__plaque">
        <svg className="brand-mark__corner brand-mark__corner--left" viewBox="0 0 28 28" aria-hidden="true">
          <path d="M3 15V3h12" />
          <path d="M7 6h7" />
          <path d="M3 8v7" />
        </svg>
        <svg className="brand-mark__corner brand-mark__corner--right" viewBox="0 0 28 28" aria-hidden="true">
          <path d="M13 3h12v12" />
          <path d="M14 6h7" />
          <path d="M25 8v7" />
        </svg>
        <h1 id={titleId} className="brand-mark__title">FLIP7</h1>
        <svg className="brand-mark__burst" viewBox="0 0 28 28" aria-hidden="true">
          <path d="M14 2v24M2 14h24M5 5l18 18M23 5L5 23" />
          <circle cx="14" cy="14" r="3" />
        </svg>
      </div>
      <div className="brand-mark__ribbon" aria-hidden="true">
        <span>COMPANION</span>
      </div>
    </div>
  )
}
