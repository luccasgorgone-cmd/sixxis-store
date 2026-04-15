import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}
interface Props {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: Props) {
  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          height: 36,
          gap: 0,
          listStyle: 'none',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
        role="list"
      >
        {items.map((item, i) => (
          <div
            key={i}
            role="listitem"
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              flexShrink: 0,
              minHeight: 0,
              height: 'auto',
              lineHeight: 1,
              margin: 0,
              padding: 0,
            }}
          >
            {i > 0 && (
              <span
                aria-hidden="true"
                style={{
                  margin: '0 6px',
                  color: '#9ca3af',
                  fontSize: 11,
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
                  color: '#6b7280',
                  textDecoration: 'none',
                  lineHeight: 1,
                  minHeight: 0,
                  height: 'auto',
                  display: 'inline',
                  padding: 0,
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                style={{
                  fontSize: 11,
                  color: '#111827',
                  fontWeight: 600,
                  lineHeight: 1,
                  minHeight: 0,
                  display: 'inline',
                }}
              >
                {item.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
