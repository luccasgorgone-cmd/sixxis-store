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
    <nav
      aria-label="Caminho da página"
      style={{
        backgroundColor: '#0f2e2b',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        width: '100%',
      }}
    >
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
        <ol
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            listStyle: 'none',
            margin: 0,
            padding: '8px 0',
            whiteSpace: 'nowrap',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            gap: 0,
            height: 32,
            minHeight: 0,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {items.map((item, i) => (
            <li
              key={i}
              style={{
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'center',
                flexShrink: 0,
                lineHeight: 1,
                minHeight: 0,
                height: 'auto',
                padding: 0,
                margin: 0,
              }}
            >
              {i > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    color: 'rgba(255,255,255,0.25)',
                    fontSize: 10,
                    margin: '0 6px',
                    flexShrink: 0,
                    lineHeight: 1,
                    minHeight: 0,
                    display: 'inline',
                    userSelect: 'none',
                  }}
                >
                  /
                </span>
              )}
              {item.href && i < items.length - 1 ? (
                <Link
                  href={item.href}
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.45)',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    display: 'inline',
                    minHeight: 0,
                    height: 'auto',
                    padding: 0,
                    margin: 0,
                  }}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.9)',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    display: 'inline',
                    minHeight: 0,
                  }}
                >
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}
