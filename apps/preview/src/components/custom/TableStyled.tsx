const HEADERS = ["Initiative", "Agency", "Status", "Budget (SGD)", "Timeline"]

const ROWS = [
  ["Digital Identity Framework", "GovTech", "Active", "$4.2M", "FY2024–2026"],
  ["National AI Strategy 2.0", "MDDI", "Active", "$12.0M", "FY2024–2030"],
  ["Greenprint Dashboard", "NEA", "Completed", "$1.8M", "FY2023–2024"],
  ["HealthHub Enhancement", "MOH", "In Review", "$3.5M", "FY2025–2026"],
  ["SGQR Expansion", "MAS", "Active", "$2.1M", "FY2024–2025"],
  ["Smart Nation Sensor Platform", "GovTech", "Planning", "$8.4M", "FY2025–2027"],
  ["Digital Utilities Marketplace", "EMA", "Completed", "$5.6M", "FY2022–2024"],
]

export default function TableStyled() {
  return (
    <section className="my-6">
      <h2 className="prose-display-sm text-base-content-strong mb-2">
        Government Digital Initiatives
      </h2>
      <p className="prose-body-base text-base-content mb-8">
        An overview of active and completed digital transformation programmes
        across agencies.
      </p>

      <div style={{ overflowX: "auto", border: "1px solid #e5e7eb" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 640,
          }}
        >
          <thead>
            <tr>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="prose-label-sm"
                  style={{
                    background: "var(--color-brand-interaction-default)",
                    color: "white",
                    padding: "14px 18px",
                    textAlign: "left",
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
                    className={j === 0 ? "prose-body-sm" : "prose-body-sm"}
                    style={{
                      padding: "13px 18px",
                      borderBottom: "1px solid #f0f0f0",
                      color:
                        j === 0
                          ? "var(--color-base-content-strong)"
                          : "var(--color-base-content)",
                      fontWeight: j === 0 ? 600 : 400,
                    }}
                  >
                    {cell}
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
