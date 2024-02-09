export interface HeroProps {
  sectionIdx?: number
  logoUrl?: string
  heroTitle?: string
  heroCaption?: string
  buttonLabel?: string
  buttonUrl?: string
  bgUrl?: string
}

export default function Hero({
  heroTitle,
  heroCaption,
  buttonLabel,
  buttonUrl,
  bgUrl,
}: HeroProps) {
  return (
    <div className="bg-white">
      <div
        className="relative isolate px-6 pt-14 lg:px-8"
        style={{
          background: bgUrl
            ? `linear-gradient(rgba(0,0,0,0.3),rgba(0,0,0,0.3)), url(${bgUrl})`
            : "",
          backgroundSize: "cover",
        }}
      >
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        ></div>
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1
              className={`text-8xl font-bold ${
                bgUrl ? "text-white" : "text-gray-900"
              } sm:text-6xl`}
            >
              {heroTitle || "Supercharge your sites like never before"}
            </h1>
            <p
              className={`mt-6 text-lg leading-8 ${
                bgUrl ? "text-white" : "text-gray-600"
              }`}
            >
              {heroCaption ||
                "Isomer Next is here to create fast and beautiful informational static sites. Embrace the power of simplicity combined with creativity now."}
            </p>
            {buttonLabel && buttonUrl && (
              <div className="mt-10 flex items-center justify-center">
                <a
                  href={buttonUrl}
                  className="px-4 py-3 text-sm font-medium shadow-sm bg-primary text-white tracking-wide uppercase"
                >
                  {buttonLabel}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
