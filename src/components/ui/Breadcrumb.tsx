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
    <nav
      className="w-full bg-[#111717] border-b border-[#2A3937] py-3 px-4"
      aria-label="Breadcrumb"
    >
      <ol
        className="max-w-7xl mx-auto flex items-center flex-nowrap overflow-x-auto whitespace-nowrap text-[11px] leading-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={i} className="flex items-center shrink-0 leading-none">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className="inline-flex items-center leading-none shrink-0 mx-1.5 text-[#B0BFBC] text-xs select-none"
                >
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="inline-flex items-center leading-none whitespace-nowrap shrink-0 text-[#B0BFBC] hover:text-[#65E5D4] transition-all"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="inline-flex items-center leading-none whitespace-nowrap shrink-0 font-bold text-[#F4F7F6]"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
