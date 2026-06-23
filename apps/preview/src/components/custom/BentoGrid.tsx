const BENTO_ITEMS = [
  {
    img: "https://picsum.photos/seed/bento-a/500/400",
    title: "Simpler forms, faster outcomes",
    desc: "Streamlined digital forms that reduce submission time by 60%.",
    paletteIdx: 1,
    colSpan: 3,
  },
  {
    img: "https://picsum.photos/seed/bento-b/400/400",
    title: "Data at your fingertips",
    desc: "Real-time dashboards to help agencies make informed decisions.",
    paletteIdx: 2,
    colSpan: 2,
  },
  {
    img: "https://picsum.photos/seed/bento-c/400/400",
    title: "Seamless identity verification",
    desc: "Secure and frictionless login for residents.",
    paletteIdx: 3,
    colSpan: 2,
  },
  {
    img: "https://picsum.photos/seed/bento-d/500/400",
    title: "One platform, many services",
    desc: "A unified experience across all government touchpoints.",
    paletteIdx: 4,
    colSpan: 3,
  },
]

export default function BentoGrid() {
  return (
    <section className="mx-auto max-w-screen-xl px-6 py-16 md:px-10">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 16,
        }}
      >
        {BENTO_ITEMS.map((item, i) => {
          const paletteVar = `--palette-${item.paletteIdx}-canvas-alt`
          const paletteInteraction = `--palette-${item.paletteIdx}-interaction`

          return (
            <div
              key={i}
              style={{
                gridColumn: `span ${item.colSpan}`,
                position: "relative",
                background: `linear-gradient(135deg, var(${paletteVar}, #e8f0f7) 0%, white 75%)`,
                borderRadius: 18,
                overflow: "hidden",
                minHeight: 240,
                padding: "28px 32px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              {/* Corner image */}
              <div
                style={{
                  position: "absolute",
                  top: -12,
                  right: -12,
                  width: "48%",
                  height: "72%",
                  overflow: "hidden",
                  borderRadius: 14,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                }}
              >
                <img
                  src={item.img}
                  alt={item.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              {/* Text */}
              <div style={{ position: "relative", zIndex: 1 }}>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 20,
                    lineHeight: 1.25,
                    marginBottom: 8,
                    color: `var(${paletteInteraction}, var(--color-base-content-strong, #111827))`,
                  }}
                >
                  {item.title}
                </p>
                <p
                  className="prose-body-sm text-base-content"
                  style={{ maxWidth: "65%" }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
