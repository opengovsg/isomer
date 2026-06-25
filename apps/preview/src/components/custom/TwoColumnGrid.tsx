import { useContext } from "react"
import { BlockConfigContext } from "../BlockConfigContext"

export type TwoColSlotType =
  | "empty"
  | "text"
  | "image"
  | "quote"
  | "callout"
  | "cta"
  | "youtube"
  | "map"
  | "accordions"

// ── Slot renderers — styled to match Isomer component designs ─────────────

function TextSlot() {
  return (
    <div>
      <h3
        className="prose-headline-lg-semibold text-base-content-strong"
        style={{ marginBottom: 12 }}
      >
        Supporting local enterprises
      </h3>
      <p className="prose-body-base text-base-content" style={{ marginBottom: 10 }}>
        The Enterprise Development Grant (EDG) helps Singapore companies grow and
        transform. Eligible businesses can receive up to 70% funding support on
        qualifying project costs.
      </p>
      <p className="prose-body-base text-base-content">
        Projects span three pillars: core capabilities, innovation and
        productivity, and market access.
      </p>
    </div>
  )
}

function ImageSlot({ index }: { index: number }) {
  const seed = index === 0 ? "sgov-a" : "sgov-b"
  return (
    <img
      src={`https://picsum.photos/seed/${seed}/800/520`}
      alt=""
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  )
}

// Matches Blockquote default layout
function QuoteSlot() {
  return (
    <section className="bg-base-canvas-alt border-l-4 border-brand-canvas-inverse">
      <div className="flex flex-col gap-6 px-5 py-4">
        <div className="flex flex-col gap-3">
          {/* Quote icon */}
          <div className="text-brand-canvas-inverse" style={{ fontSize: 32, lineHeight: 1 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/>
            </svg>
          </div>
          <div className="flex flex-col gap-3">
            <blockquote className="prose-headline-base-medium italic text-base-content-strong">
              The EDG was transformative for our business. With the funding support, we adopted
              new digital systems and expanded into three overseas markets within a year.
            </blockquote>
            <cite className="prose-body-sm text-base-content-default not-italic">
              — Lee Wei Ming, CEO, Meridian Solutions Pte Ltd
            </cite>
          </div>
        </div>
      </div>
    </section>
  )
}

// Matches Callout (info variant)
function CalloutSlot() {
  return (
    <div className="prose-headline-lg-regular rounded-lg border border-utility-feedback-info bg-utility-feedback-info-subtle px-5 py-4">
      <p className="prose-label-md-medium text-base-content-strong" style={{ fontWeight: 600, marginBottom: 4 }}>
        Important note
      </p>
      <p className="prose-body-base text-base-content">
        SMEs receive up to 70% funding support; non-SMEs are eligible for up to
        50%. Projects must commence within 6 months of approval.
      </p>
    </div>
  )
}

// Matches Infobar default (light scheme)
function CTASlot() {
  return (
    <div className="rounded-lg bg-base-canvas-backdrop">
      <div className="flex flex-col items-start gap-7 p-8">
        <div className="flex flex-col gap-4">
          <h3 className="prose-display-xs text-base-content-strong break-words">
            Ready to apply?
          </h3>
          <p className="prose-body-base text-base-content">
            Check your eligibility and submit your application through the
            Business Grants Portal today.
          </p>
        </div>
        <a
          href="#"
          className="prose-body-base-semibold inline-flex items-center justify-center rounded-full border border-brand-canvas-inverse bg-brand-canvas-inverse px-5 py-2.5 text-base-content-inverse no-underline hover:bg-brand-interaction-hover"
        >
          Apply now
        </a>
      </div>
    </div>
  )
}

// Matches Video component (YouTube) — facade thumbnail + play button
function YouTubeSlot() {
  return (
    <section>
      <div className="relative w-full overflow-hidden" style={{ paddingTop: "56.25%" }}>
        <img
          src="https://i.ytimg.com/vi/dQw4w9WgXcQ/sddefault.jpg"
          alt="Video thumbnail"
          className="absolute inset-0 h-full w-full bg-black object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          {/* YouTube play button SVG — matches LiteYouTubeEmbed */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 68 48"
            style={{ width: 68, height: 48 }}
            aria-hidden
          >
            <path
              fill="#FF0033"
              d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
            />
            <path fill="#fff" d="M45 24 27 14v20" />
          </svg>
        </div>
      </div>
    </section>
  )
}

// Matches Map component — 4:3 iframe container
function MapSlot() {
  return (
    <section>
      <div className="relative w-full overflow-hidden" style={{ paddingTop: "75%" }}>
        <iframe
          title="Map"
          src="https://www.openstreetmap.org/export/embed.html?bbox=103.81,1.27,103.87,1.32&layer=mapnik&marker=1.2966,103.8497"
          className="absolute bottom-0 left-0 right-0 top-0 border-0"
          width="100%"
          height="100%"
          loading="lazy"
        />
      </div>
    </section>
  )
}

// Matches Accordion component — native <details> elements
function AccordionsSlot() {
  const items = [
    {
      summary: "Who is eligible for the EDG?",
      details:
        "Singapore-registered companies with at least 30% local shareholding and a minimum of 3 local employees in a financially viable position.",
    },
    {
      summary: "What costs are covered?",
      details:
        "Qualifying costs include manpower, professional services, software, equipment, and hardware directly related to the approved project.",
    },
    {
      summary: "How long does approval take?",
      details:
        "Applications are typically processed within 4 to 6 weeks from submission, provided all required documents are in order.",
    },
  ]
  return (
    <>
      {items.map((item, i) => (
        <details
          key={i}
          open={i === 0}
          className="group border-y border-divider-medium px-4 py-5 first:mt-0 has-[+_details]:border-b-0 [&+details]:mt-0"
        >
          <summary className="prose-headline-lg-medium flex list-none flex-row items-center justify-between gap-3 text-base-content-strong hover:cursor-pointer">
            {item.summary}
            {/* minus — visible when open */}
            <svg className="h-6 w-6 flex-shrink-0 hidden group-open:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {/* plus — visible when closed */}
            <svg className="h-6 w-6 flex-shrink-0 block group-open:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </summary>
          <div className="pt-5 text-base-content-strong">
            <p className="prose-body-base text-base-content">{item.details}</p>
          </div>
        </details>
      ))}
    </>
  )
}

function EmptySlot() {
  return (
    <div
      style={{
        minHeight: 160,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span className="prose-body-sm text-base-content-subtle">
        Select a block type
      </span>
    </div>
  )
}

function SlotContent({ type, index }: { type: TwoColSlotType; index: number }) {
  switch (type) {
    case "text":       return <TextSlot />
    case "image":      return <ImageSlot index={index} />
    case "quote":      return <QuoteSlot />
    case "callout":    return <CalloutSlot />
    case "cta":        return <CTASlot />
    case "youtube":    return <YouTubeSlot />
    case "map":        return <MapSlot />
    case "accordions": return <AccordionsSlot />
    default:           return <EmptySlot />
  }
}

// ── Main component ────────────────────────────────────────────────────────

export default function TwoColumnGrid() {
  const { configs } = useContext(BlockConfigContext)
  const cfg = configs["two-column-grid"] ?? {}
  const slot1 = (cfg.slot1 as TwoColSlotType) ?? "empty"
  const slot2 = (cfg.slot2 as TwoColSlotType) ?? "empty"

  return (
    <div className="component-content my-8">
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 40 }}>
        {([slot1, slot2] as const).map((type, index) => (
          <div
            key={index}
            style={
              type === "empty"
                ? { border: "2px dashed #cbd5e1", borderRadius: 10, minHeight: 160 }
                : {}
            }
          >
            <SlotContent type={type} index={index} />
          </div>
        ))}
      </div>
    </div>
  )
}
