const ITEMS = [
  "Failure to conduct appropriate reviews for residents in multiple aspects including falls, pressure injuries and weight loss;",
  "Failure to follow up on or adhere to the residents' care plans;",
]

export default function ListsWithIndentation() {
  return (
    <section className="my-6">
      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {ITEMS.map((text, i) => (
          <li key={i} style={{ display: "flex" }}>
            <span
              className="prose-body-base text-base-content"
              style={{ flexShrink: 0, whiteSpace: "pre", fontVariantNumeric: "tabular-nums" }}
            >
              {i + 1}.{"        "}
            </span>
            <span className="prose-body-base text-base-content">{text}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
