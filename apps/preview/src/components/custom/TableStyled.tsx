const HEADERS = ["Initiative", "Agency", "Status", "Budget (SGD)", "Timeline"]

const ROWS = [
  ["Digital Identity Framework", "GovTech", "Active", "$4.2M", "FY2024–2026"],
  ["National AI Strategy 2.0", "MDDI", "Active", "$12.0M", "FY2024–2030"],
  ["Greenprint Dashboard", "NEA", "Completed", "$1.8M", "FY2023–2024"],
  ["HealthHub Enhancement", "MOH", "In Review", "$3.5M", "FY2025–2026"],
  ["SGQR Expansion", "MAS", "Active", "$2.1M", "FY2024–2025"],
  [
    "Smart Nation Sensor Platform",
    "GovTech",
    "Planning",
    "$8.4M",
    "FY2025–2027",
  ],
  [
    "Digital Utilities Marketplace",
    "EMA",
    "Completed",
    "$5.6M",
    "FY2022–2024",
  ],
]

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Active: { bg: "#dcfce7", color: "#15803d" },
  Completed: { bg: "#dbeafe", color: "#1d4ed8" },
  "In Review": { bg: "#fef3c7", color: "#b45309" },
  Planning: { bg: "#f3e8ff", color: "#7e22ce" },
}

export default function TableStyled() {
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "72px 48px" }}>
      <h2
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: "#111827",
          marginBottom: 10,
        }}
      >
        Government Digital Initiatives
      </h2>
      <p
        style={{
          fontSize: 16,
          color: "#6b7280",
          marginBottom: 32,
          lineHeight: 1.6,
        }}
      >
        An overview of active and completed digital transformation programmes
        across agencies.
      </p>

      <div
        style={{
          overflowX: "auto",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
            minWidth: 640,
          }}
        >
          <thead>
            <tr>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  style={{
                    background: "var(--color-brand-interaction-default)",
                    color: "white",
                    padding: "14px 18px",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr
                key={i}
                style={{
                  background:
                    i % 2 === 1
                      ? "var(--color-brand-canvas-alt, #f3f4f6)"
                      : "white",
                }}
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    style={{
                      padding: "13px 18px",
                      borderBottom: "1px solid #f0f0f0",
                      color: j === 0 ? "#111827" : "#4b5563",
                      fontWeight: j === 0 ? 600 : 400,
                    }}
                  >
                    {j === 2 ? (
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          ...(STATUS_STYLE[cell] ?? {
                            bg: "#f3f4f6",
                            color: "#374151",
                          }),
                          background: STATUS_STYLE[cell]?.bg ?? "#f3f4f6",
                          color: STATUS_STYLE[cell]?.color ?? "#374151",
                        }}
                      >
                        {cell}
                      </span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
