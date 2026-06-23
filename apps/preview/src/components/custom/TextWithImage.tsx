import { useContext } from "react"
import { BlockConfigContext } from "../BlockConfigContext"

const SAMPLE_IMG =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop"

export default function TextWithImage() {
  const { configs } = useContext(BlockConfigContext)
  const config = configs["text-with-image"] ?? {}
  const position = (config.imagePosition as "left" | "right") ?? "left"
  const size = (config.imageSize as "large" | "small") ?? "large"

  const imgFirst = position === "left"
  const imgDesktopWidth = size === "large" ? "50%" : "30%"

  const imgEl = (
    <div className="twi-img-col w-full flex-shrink-0">
      <style>{`
        @media (min-width: 768px) {
          .twi-img-col { width: ${imgDesktopWidth} !important; }
        }
      `}</style>
      <img
        src={SAMPLE_IMG}
        alt="Featured"
        style={{ width: "100%", height: "auto", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
      />
    </div>
  )

  const textEl = (
    <div style={{ flex: 1, minWidth: 0 }}>
      <h2 className="prose-display-sm text-base-content-strong" style={{ marginBottom: 16 }}>
        Supporting Singapore's enterprise transformation
      </h2>
      <p className="prose-body-base text-base-content" style={{ marginBottom: 16 }}>
        The Enterprise Development Grant (EDG) has supported thousands of
        Singapore companies in building stronger foundations for growth. From
        upgrading core capabilities to expanding into new markets, the grant
        provides targeted funding to help businesses transform and compete
        globally.
      </p>
      <p className="prose-body-base text-base-content">
        Since its launch in 2018, the programme has disbursed over $2 billion in
        support, with companies across manufacturing, services, and trade
        benefiting from the scheme. The grant covers up to 70% of qualifying
        project costs for SMEs, making it one of the most accessible business
        transformation support programmes available.
      </p>
    </div>
  )

  return (
    <section className="my-6">
      <div className="flex flex-col gap-8 md:flex-row md:gap-12">
        {imgFirst ? imgEl : textEl}
        {imgFirst ? textEl : imgEl}
      </div>
    </section>
  )
}
