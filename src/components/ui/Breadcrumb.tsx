'use client'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: Props) {
  return (
    <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
        <ol
          style={{
            display: 'flex',
            alignItems: 'center',
            listStyle: 'none',
            margin: 0,
            padding: '10px 0',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            gap: 0,
            scrollbarWidth: 'none',
          }}
        >
          {items.map((item, i) => {
            const isLast = i === items.length - 1
            return (
              <li
                key={i}
                style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                {i > 0 && (
                  <svg
                    width="12" height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0, margin: '0 6px' }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
                {isLast ? (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#111827',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}>
                    {item.label}
                  </span>
                ) : (
                  <a
                    href={item.href || '#'}
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#374151')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
