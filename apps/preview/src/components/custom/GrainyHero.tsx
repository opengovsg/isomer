import { useContext } from "react"
import { BlockConfigContext } from "../BlockConfigContext"

const SITE_IMAGES: Record<string, string> = {
  corporate: "https://picsum.photos/seed/ministry/700/600",
  campaign:  "https://picsum.photos/seed/campaign/700/600",
  formal:    "https://picsum.photos/seed/formal/700/600",
  modern:    "https://picsum.photos/seed/techoffice/700/600",
  school:    "https://picsum.photos/seed/schoolyard/700/600",
}

export default function GrainyHero() {
  const { configs } = useContext(BlockConfigContext)
  const preset = configs["grainy-hero"]?.sitePreset ?? "corporate"
  const imgSrc = SITE_IMAGES[preset] ?? SITE_IMAGES.corporate

  return (
    <section
      style={{
        position: "relative",
        background: "var(--color-brand-canvas-inverse, #00405f)",
        overflow: "hidden",
        minHeight: 420,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* SVG grain overlay */}
      <svg
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <filter id="grainy-hero-noise" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.7"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grainy-hero-noise)" opacity="0.12" />
      </svg>

      {/* Content */}
      <div
        className="mx-auto w-full max-w-screen-xl px-6 md:px-10"
        style={{ position: "relative", zIndex: 2, paddingTop: 72, paddingBottom: 72 }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Text column */}
          <div style={{ flex: "0 0 55%", paddingRight: 48 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
                marginBottom: 18,
              }}
            >
              Featured
            </p>
            <h2
              className="prose-display-sm"
              style={{ color: "white", marginBottom: 18, lineHeight: 1.15 }}
            >
              Building better services for Singapore
            </h2>
            <p
              className="prose-body-base"
              style={{ color: "rgba(255,255,255,0.72)", marginBottom: 36, maxWidth: 400 }}
            >
              We design and deliver products that make government services simpler, faster, and more accessible for everyone.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a
                href="#"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "white",
                  color: "var(--color-brand-canvas-inverse, #00405f)",
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "12px 24px",
                  borderRadius: 6,
                  textDecoration: "none",
                }}
              >
                Get started
              </a>
              <a
                href="#"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 14,
                  padding: "12px 24px",
                  borderRadius: 6,
                  textDecoration: "none",
                  border: "1.5px solid rgba(255,255,255,0.35)",
                }}
              >
                Learn more
              </a>
            </div>
          </div>

          {/* Image — slightly clipped at top/bottom edges */}
          <div
            style={{
              flex: "0 0 45%",
              position: "relative",
              height: 360,
              overflow: "hidden",
              borderRadius: 12,
              marginRight: -48,
            }}
          >
            <img
              src={imgSrc}
              alt="Hero visual"
              style={{
                width: "110%",
                height: "110%",
                objectFit: "cover",
                objectPosition: "center",
                marginLeft: "-5%",
                marginTop: "-5%",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
