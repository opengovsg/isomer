const HEADER_IMAGE =
  "https://www.figma.com/api/mcp/asset/441f627b-fb26-45da-8884-293598af3e3e"
const FEATURE_IMGS = [
  "https://www.figma.com/api/mcp/asset/4dc44671-9378-4d8d-b9b3-a8d9395b63b6",
  "https://www.figma.com/api/mcp/asset/52751627-7e23-4fee-8822-83b669ecfe91",
  "https://www.figma.com/api/mcp/asset/9eab5665-d9da-4c22-97ec-fa1738ad1e62",
]
const MAP_IMAGE =
  "https://www.figma.com/api/mcp/asset/4e0b5980-b6ab-4072-a848-597586ad7cef"
const HOST_IMAGE =
  "https://www.figma.com/api/mcp/asset/bbf16bce-0b94-4cb6-bb1b-03b073736d3b"

const TABS = [
  "What to expect",
  "Fees and registration",
  "Schedule",
  "Frequently asked questions",
]

function PinIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export default function EventLayout() {
  return (
    <div>
      {/* 1. Full-bleed header image */}
      <div style={{ width: "100%", height: 400, overflow: "hidden" }}>
        <img
          src={HEADER_IMAGE}
          alt="Event header"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* 2. Key info + CTA */}
      <div className="mx-auto max-w-screen-xl px-6 py-10 md:px-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Event details — 7 cols */}
          <div className="flex flex-col gap-6 md:col-span-7">
            <div className="flex flex-col gap-3">
              <p className="prose-body-base text-base-content">Events</p>
              <h1 className="prose-display-sm text-base-content-strong">
                Open Government Products Career Fair
              </h1>
              <p
                className="prose-title-lg-regular"
                style={{ color: "var(--color-base-content-light, #6b7280)" }}
              >
                Build tech for public good with us.
              </p>
            </div>
            <div className="flex flex-col gap-3 text-base-content-strong">
              <div className="flex items-center gap-3">
                <PinIcon />
                <span className="prose-headline-lg-medium text-base-content-strong">
                  Lazada One, Bras Basah Road
                </span>
              </div>
              <div className="flex items-center gap-3">
                <ClockIcon />
                <span className="prose-headline-lg-medium text-base-content-strong">
                  8pm, 22 June 2026
                </span>
              </div>
            </div>
          </div>

          {/* CTA card — 4 cols */}
          <div className="md:col-span-4 md:col-start-9">
            <div
              className="flex flex-col gap-3 rounded-lg p-6"
              style={{
                background: "var(--color-brand-canvas-alt, #e6ecef)",
              }}
            >
              <p className="prose-headline-base-medium text-base-content">
                Registration ends in 2 days.
              </p>
              <a
                href="#"
                className="flex w-full items-center justify-center gap-2 rounded px-5 py-3"
                style={{
                  background: "var(--color-brand-canvas-inverse, #00405f)",
                  textDecoration: "none",
                }}
              >
                <span
                  className="prose-headline-base-medium"
                  style={{ color: "white" }}
                >
                  Register now
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 3H3v10h10v-3M9 3h4v4M13 3L7 9" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tabs (non-interactive) */}
      <div
        className="mx-auto max-w-screen-xl px-6 md:px-10"
        style={{
          borderBottom: "2px solid var(--color-base-divider-medium, #d1d5db)",
        }}
      >
        <div className="flex gap-6 overflow-x-auto md:gap-12">
          {TABS.map((tab, i) => (
            <div
              key={tab}
              className="shrink-0 py-4 whitespace-nowrap"
              style={{
                borderBottom:
                  i === 0
                    ? "2px solid var(--color-brand-interaction-default, #00405f)"
                    : "2px solid transparent",
                marginBottom: -2,
              }}
            >
              <span
                className={
                  i === 0
                    ? "prose-headline-lg-semibold"
                    : "prose-headline-lg-regular"
                }
                style={{
                  color:
                    i === 0
                      ? "var(--color-brand-interaction-default, #00405f)"
                      : "var(--color-base-content-subtle, #4b5563)",
                }}
              >
                {tab}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Body content */}
      <div className="mx-auto max-w-screen-xl px-6 py-12 md:px-10">
        {/* Text paragraph — 6 cols centered */}
        <p className="prose-body-base text-base-content mx-auto w-full max-w-[560px]">
          Whether it's your first career fair or you're a seasoned job seeker,
          here's everything you need to know to make the most of your day at the
          Public Service Career Fair 2026.
          <br />
          <br />
          The fair is held across three halls at the Singapore Expo, Convention
          Hall A–C. Each hall is organised by sector — healthcare and social
          services in Hall A, technology and digital services in Hall B, and
          policy, law, and administration in Hall C.
        </p>
      </div>

      {/* Feature images — full-bleed beyond viewport, scrollable on mobile */}
      <div
        className="my-2 overflow-x-auto md:overflow-hidden"
        style={{ marginLeft: "calc(-50vw + 50%)", width: "100vw" }}
      >
        <div className="flex gap-10 px-6 py-1 md:justify-center md:px-0">
          {FEATURE_IMGS.map((src, i) => (
            <div
              key={i}
              className="w-[280px] h-[200px] md:w-[562px] md:h-[375px] shrink-0 overflow-hidden rounded-lg"
            >
              <img
                src={src}
                alt={`Event photo ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl px-6 py-12 md:px-10">
        {/* More text */}
        <p className="prose-body-base text-base-content mx-auto mb-12 w-full max-w-[560px]">
          Come prepared with at least five printed copies of your résumé. While
          some agencies accept digital submissions on the spot, having physical
          copies ensures you won't miss out. You may also want to bring your
          academic transcripts and a list of referees, as some booths conduct
          preliminary interviews on the day.
        </p>

        {/* Location — 4 cols text + 8 cols map */}
        <div className="mb-12 grid grid-cols-1 items-center gap-6 md:grid-cols-12 md:gap-10">
          <div className="flex flex-col gap-3 md:col-span-4">
            <p
              className="prose-label-sm text-base-content"
              style={{ textTransform: "uppercase" }}
            >
              We'll be here:
            </p>
            <p
              className="prose-headline-lg-semibold"
              style={{
                color: "var(--color-brand-interaction-default, #00405f)",
                fontSize: 24,
              }}
            >
              At Lazada One
            </p>
            <div className="prose-body-sm text-base-content">
              <p>51 Bras Basah Road, 12345. Find us at Level 4.</p>
              <ul
                className="mt-2 flex flex-col gap-1"
                style={{ listStyle: "disc", paddingLeft: 20 }}
              >
                <li>
                  If you're taking MRT: Get off at Bencoolen station.
                </li>
                <li>
                  If you're taking Grab: Asked to be dropped off at Lazada One.
                </li>
              </ul>
            </div>
          </div>
          <div
            className="overflow-hidden rounded-lg md:col-span-8"
            style={{ height: 300 }}
          >
            <img
              src={MAP_IMAGE}
              alt="Map"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>

        {/* Slot for article formatting blocks (footnotes, lists, etc.) */}
        <div id="event-article-body-slot" className="mb-12" />

        {/* Meet the host — centered card */}
        <div
          className="mx-auto flex w-full max-w-[549px] flex-col items-center gap-6 rounded-lg p-6 md:flex-row md:gap-10 md:p-7"
          style={{
            background: "var(--color-base-canvas-alt, #f9fafb)",
            boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="shrink-0 overflow-hidden rounded-full"
            style={{ width: 139, height: 139 }}
          >
            <img
              src={HOST_IMAGE}
              alt="Host"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <p
              className="prose-label-sm text-base-content"
              style={{ textTransform: "uppercase" }}
            >
              Meet the host
            </p>
            <p
              className="prose-headline-lg-medium"
              style={{
                color: "var(--color-brand-interaction-default, #00405f)",
              }}
            >
              Open Government Products
            </p>
            <p className="prose-body-sm text-base-content">
              We believe in hiring the best talents to work on public good.
            </p>
            <a
              href="#"
              className="prose-body-sm"
              style={{
                color: "var(--color-base-link-default, #1a56e5)",
                textDecoration: "underline",
              }}
            >
              Visit our website!
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
