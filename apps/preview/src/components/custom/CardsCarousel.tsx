import { useRef } from "react"

const CARDS = [
  {
    title: "Innovation Fund",
    desc: "Co-funding for deep-tech startups building for the public sector.",
    img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=420&h=420&fit=crop",
  },
  {
    title: "Smart Nation Labs",
    desc: "Rapid prototyping spaces co-located with government agencies.",
    img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=420&h=420&fit=crop",
  },
  {
    title: "Open Data Portal",
    desc: "Access thousands of curated government datasets for research.",
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=420&h=420&fit=crop",
  },
  {
    title: "Digital Academy",
    desc: "Skills programmes for public officers to master emerging technologies.",
    img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=420&h=420&fit=crop",
  },
  {
    title: "GovTech Ventures",
    desc: "Connecting startups with government agencies for pilot deployments.",
    img: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=420&h=420&fit=crop",
  },
  {
    title: "Cyber Trust Mark",
    desc: "Certification for companies meeting government cybersecurity standards.",
    img: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=420&h=420&fit=crop",
  },
  {
    title: "AI Governance Framework",
    desc: "Guidelines and tools for ethical deployment of AI in public services.",
    img: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=420&h=420&fit=crop",
  },
]

const CARD_W = 280
const GAP = 12


export default function CardsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null)

  function scroll(dir: "left" | "right") {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({
      left: dir === "left" ? -(CARD_W + GAP) * 2 : (CARD_W + GAP) * 2,
      behavior: "smooth",
    })
  }

  return (
    <section className="component-content py-12 md:py-16">
      <style>{`
        .cc-track::-webkit-scrollbar { display: none; }
        .cc-track { scrollbar-width: none; }
        .cc-card-img-wrap {
          aspect-ratio: 1;
          overflow: hidden;
          outline: 2px solid transparent;
          outline-offset: -2px;
          transition: outline-color 0.18s;
        }
        .cc-card:hover .cc-card-img-wrap {
          outline-color: var(--color-brand-interaction-default);
        }
        .cc-card-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cc-chevron {
          width: 40px; height: 40px;
          border: 1.5px solid #d1d5db;
          border-radius: 8px;
          background: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #374151;
          transition: border-color 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .cc-chevron:hover {
          border-color: var(--color-brand-interaction-default);
          color: var(--color-brand-interaction-default);
        }
      `}</style>

      {/* Header row */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <h2 className="prose-display-sm text-base-content-strong mb-2">
            Explore our ecosystem
          </h2>
          <p className="prose-body-base text-base-content">
            Programmes, spaces, and resources for the builder community.
          </p>
        </div>
        <div className="flex gap-2 pb-0.5">
          <button className="cc-chevron" onClick={() => scroll("left")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button className="cc-chevron" onClick={() => scroll("right")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable track — clip cards at edges */}
      <div style={{ overflow: "hidden" }}>
        <div
          ref={trackRef}
          className="cc-track"
          style={{ display: "flex", gap: GAP, overflowX: "auto", paddingBottom: 8 }}
        >
          {CARDS.map((card, i) => (
            <div
              key={i}
              className="cc-card"
              style={{
                flex: `0 0 ${CARD_W}px`,
                background: "white",
                overflow: "hidden",
                cursor: "pointer",
              }}
            >
              <div className="cc-card-img-wrap">
                <img className="cc-card-img" src={card.img} alt={card.title} />
              </div>
              <div className="pt-4 pb-5">
                <h3 className="prose-headline-lg-semibold text-base-content-strong mb-2">
                  {card.title}
                </h3>
                <p className="prose-body-base text-base-content">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
