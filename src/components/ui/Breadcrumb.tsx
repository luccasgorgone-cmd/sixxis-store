import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: Props) {
  if (!items?.length) return null
  return (
    <div style={{ backgroundColor: '#0f2e2b', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
        <ol style={{
          display: 'flex',
          alignItems: 'center',
          listStyle: 'none',
          margin: 0,
          padding: '9px 0',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          gap: 0,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          whiteSpace: 'nowrap',
        }}>
          {items.map((item, i) => {
            const isLast = i === items.length - 1
            return (
              <li key={i} style={{
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
                lineHeight: 1,
              }}>
                {i > 0 && (
                  <span style={{
                    color: 'rgba(255,255,255,0.25)',
                    fontSize: '11px',
                    margin: '0 6px',
                    flexShrink: 0,
                    lineHeight: 1,
                  }}>
                    /
                  </span>
                )}
                {isLast ? (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.9)',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                  }}>
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href || '#'} style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.45)',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}>
                    {item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
