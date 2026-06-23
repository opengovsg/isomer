const LINKS = [
  "Business Grants Portal — apply and track your grants",
  "Enterprise Development Grant eligibility criteria",
  "How to apply for the EDG",
  "Market Readiness Assistance (MRA) scheme",
  "Productivity Solutions Grant (PSG)",
]

export default function LinkHubContent() {
  return (
    <div
      className="my-6"
      style={{
        background: "var(--color-brand-canvas-alt, #eef2f7)",
        borderRadius: 8,
        padding: "16px 20px",
      }}
    >
      <h3
        className="prose-headline-lg-semibold text-base-content-strong"
        style={{ marginBottom: 12 }}
      >
        Related resources
      </h3>
      <ul style={{ listStyle: "disc", paddingLeft: 18, margin: 0 }}>
        {LINKS.map((link) => (
          <li
            key={link}
            className="prose-body-sm text-base-content"
            style={{ marginBottom: 6 }}
          >
            <a
              href="#"
              className="hover:underline"
              style={{ color: "var(--color-brand-interaction-default)" }}
            >
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
