export default function HeroBlobSaaS() {
  return (
    <section className="relative flex min-h-[31.25rem] items-center overflow-hidden bg-base-canvas py-16">
      <div
        className="component-content flex w-full items-center gap-16"
        style={{ position: "relative", zIndex: 1 }}
      >
        {/* Left: Text */}
        <div style={{ flex: "0 0 440px" }}>
          <h1 className="prose-display-xl wrap-break-word text-balance text-base-content-strong mb-6">
            The modern platform for government services
          </h1>
          <p className="prose-title-lg-regular text-base-content mb-9">
            Streamline your agency's workflows, serve citizens faster, and
            build with confidence on infrastructure built for scale.
          </p>
          <div className="flex flex-row gap-x-5 gap-y-4">
            <a
              href="/"
              className="box-border flex w-fit cursor-pointer items-center gap-2 rounded text-center transition prose-headline-base-medium min-h-12 px-5 py-3 bg-brand-canvas-inverse text-base-content-inverse hover:bg-brand-interaction-hover hover:text-base-content-inverse"
            >
              Start for free
            </a>
            <a
              href="/"
              className="box-border flex w-fit cursor-pointer items-center gap-2 rounded text-center transition prose-headline-base-medium min-h-12 px-5 py-3 border border-brand-canvas-inverse bg-base-canvas text-brand-canvas-inverse hover:bg-base-canvas-backdrop"
            >
              Watch demo
            </a>
          </div>
        </div>

        {/* Right: Blobs + Screenshot */}
        <div style={{ flex: 1, position: "relative", height: 420, minWidth: 0 }}>
          {/* Blob 1 — large, top-right */}
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -80,
              width: 380,
              height: 380,
              borderRadius: "60% 40% 55% 45% / 50% 60% 40% 50%",
              background: "var(--color-brand-interaction-default)",
              opacity: 0.15,
            }}
          />
          {/* Blob 2 — small, bottom-right */}
          <div
            style={{
              position: "absolute",
              bottom: -20,
              right: 50,
              width: 180,
              height: 180,
              borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
              background: "var(--color-brand-interaction-default)",
              opacity: 0.1,
            }}
          />
          {/* Blob 3 — medium accent, left */}
          <div
            style={{
              position: "absolute",
              top: "35%",
              left: -16,
              width: 120,
              height: 120,
              borderRadius: "50% 50% 30% 70% / 60% 40% 60% 40%",
              background: "var(--color-brand-interaction-default)",
              opacity: 0.08,
            }}
          />

          {/* Screenshot */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              marginTop: 24,
              borderRadius: 16,
              overflow: "hidden",
              boxShadow:
                "0 4px 6px -1px rgba(0,0,0,0.05),0 20px 60px -10px rgba(0,0,0,0.18)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop"
              alt="SaaS dashboard"
              style={{ width: "100%", display: "block" }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
