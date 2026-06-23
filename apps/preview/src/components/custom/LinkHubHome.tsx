import { useState } from "react"

const COLUMNS = [
  {
    title: "Business Support",
    links: [
      "Start a business in Singapore",
      "Register your company",
      "Find a grant",
      "Explore support schemes",
    ],
  },
  {
    title: "Internationalisation",
    links: [
      "Expand your business overseas",
      "Market Readiness Assistance",
      "Trade missions & networks",
      "Free trade agreements",
      "Overseas business hubs",
    ],
  },
  {
    title: "Capability Building",
    links: [
      "Workforce training & upskilling",
      "Productivity solutions grant",
      "Industry transformation maps",
      "Digital adoption programme",
    ],
  },
  {
    title: "Resources & Tools",
    links: [
      "Business Grants Portal",
      "GoBusiness Singapore",
      "Enterprise Singapore",
      "Factsheets & reports",
      "Contact us",
    ],
  },
]

function LinkHubColumn({
  title,
  links,
  defaultOpen,
}: {
  title: string
  links: string[]
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      style={{
        background: "var(--color-brand-canvas-alt, #eef2f7)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {/* Mobile: tappable header with chevron */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex md:hidden"
        style={{
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          gap: 8,
        }}
      >
        <span className="prose-headline-lg-semibold text-base-content-strong">
          {title}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transition: "transform 0.2s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </button>

      {/* Tablet+: static header, always visible */}
      <div
        className="hidden md:block"
        style={{ padding: "14px 20px 0" }}
      >
        <h3 className="prose-headline-lg-semibold text-base-content-strong">
          {title}
        </h3>
      </div>

      {/* Mobile: conditionally shown */}
      <ul
        className="md:hidden"
        style={{
          listStyle: "disc",
          margin: 0,
          padding: open ? "0 20px 14px 36px" : "0",
          maxHeight: open ? 500 : 0,
          overflow: "hidden",
          transition: "max-height 0.2s ease, padding 0.2s ease",
        }}
      >
        {links.map((link) => (
          <li key={link} className="prose-body-sm text-base-content" style={{ marginBottom: 6 }}>
            <a href="#" className="hover:underline" style={{ color: "var(--color-brand-interaction-default)" }}>
              {link}
            </a>
          </li>
        ))}
      </ul>

      {/* Tablet+: always visible */}
      <ul
        className="hidden md:block"
        style={{ listStyle: "disc", margin: 0, padding: "8px 20px 14px 36px" }}
      >
        {links.map((link) => (
          <li key={link} className="prose-body-sm text-base-content" style={{ marginBottom: 6 }}>
            <a href="#" className="hover:underline" style={{ color: "var(--color-brand-interaction-default)" }}>
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function LinkHubHome() {
  return (
    <section className="component-content py-10 md:py-12">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col, i) => (
          <LinkHubColumn
            key={col.title}
            title={col.title}
            links={col.links}
            defaultOpen={i === 0}
          />
        ))}
      </div>
    </section>
  )
}
