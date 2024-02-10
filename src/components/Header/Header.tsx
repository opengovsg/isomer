import { HomeIcon } from "@heroicons/react/20/solid"

const pages = [
  { name: "Projects", href: "#", current: false },
  { name: "Project Nero", href: "#", current: true },
]

type Breadcrumb = {
  name: string
  href: string
  current?: boolean
}
export interface HeaderProps {
  title: string
  breadcrumbs: Breadcrumb[]
}

const Header = ({ title, breadcrumbs }: HeaderProps) => {
  return (
    <nav
      className="flex flex-col bg-header p-10 h-full"
      aria-label="Breadcrumb"
    >
      <ol role="list" className="flex items-center text-white">
        {breadcrumbs.map((page, idx) => (
          <li key={page.name}>
            <div className="flex items-center">
              <a
                href={page.href}
                className="text-sm font-light uppercase tracking-wider"
                aria-current={page.current ? "page" : undefined}
              >
                {page.name}
              </a>
              {idx !== breadcrumbs.length - 1 && (
                <svg
                  className="h-5 w-5 mx-2 flex-shrink-0 text-gray-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
              )}
            </div>
          </li>
        ))}
      </ol>

      <h1 className="pt-5 text-white text-3xl font-medium leading-7 sm:text-5xl sm:truncate">
        {title}
      </h1>
    </nav>
  )
}

export default Header
