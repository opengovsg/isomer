const KIDS = [
  "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=700&fit=crop",
  "https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=500&h=380&fit=crop",
  "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=500&h=380&fit=crop",
  "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=500&h=380&fit=crop",
  "https://images.unsplash.com/photo-1526634332515-d56c5fd16991?w=500&h=360&fit=crop",
]

export default function HeroCollage() {
  return (
    <section className="flex min-h-[31.25rem] items-center bg-base-canvas py-16">
      <style>{`
        .hc-img-cell { overflow: hidden; border-radius: 12px; width: 100%; height: 100%; }
        .hc-img { width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94); }
        .hc-img-cell:hover .hc-img { transform: scale(1.08); }
      `}</style>

      <div className="component-content flex w-full items-center gap-16">
        {/* Left: Text */}
        <div style={{ flex: "0 0 400px" }}>
          <h1 className="prose-display-xl wrap-break-word text-balance text-base-content-strong mb-6">
            Learning That Lights a Spark
          </h1>
          <p className="prose-title-lg-regular text-base-content mb-9">
            Engaging programmes, inspiring mentors, and a community that cheers
            every child on — from their first steps to their biggest dreams.
          </p>
          <div className="flex flex-row gap-x-5 gap-y-4">
            <a
              href="/"
              className="box-border flex w-fit cursor-pointer items-center gap-2 rounded text-center transition prose-headline-base-medium min-h-12 px-5 py-3 bg-brand-canvas-inverse text-base-content-inverse hover:bg-brand-interaction-hover hover:text-base-content-inverse"
            >
              Explore programmes
            </a>
            <a
              href="/"
              className="box-border flex w-fit cursor-pointer items-center gap-2 rounded text-center transition prose-headline-base-medium min-h-12 px-5 py-3 border border-brand-canvas-inverse bg-base-canvas text-brand-canvas-inverse hover:bg-base-canvas-backdrop"
            >
              Learn more
            </a>
          </div>
        </div>

        {/* Right: Mosaic */}
        <div
          style={{
            flex: 1,
            height: 460,
            display: "grid",
            gridTemplateAreas: '"a b c" "a d e"',
            gridTemplateColumns: "2fr 1.5fr 1.5fr",
            gridTemplateRows: "1fr 1fr",
            gap: 10,
            minWidth: 0,
          }}
        >
          {(["a", "b", "c", "d", "e"] as const).map((area, i) => (
            <div key={area} className="hc-img-cell" style={{ gridArea: area }}>
              <img className="hc-img" src={KIDS[i]} alt="" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
