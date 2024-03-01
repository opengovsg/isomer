import {
  type HeroCommonProps,
  type HeroSideProps,
  type HeroProps,
} from "~/common/Hero"
import { HeroInfobox } from "./HeroInfobox"

const HeroSide = (props: Omit<HeroSideProps, keyof HeroCommonProps>) => {
  return (
    // TODO: Check if padding top/bottom is correct
    // Ref: https://github.com/isomerpages/isomerpages-template/blob/next-gen/assets/css/blueprint.css#L9080-L9105
    <div className="grow shrink-0">
      <HeroInfobox {...props} />
    </div>
  )
}

export const Hero = (props: HeroProps) => {
  return (
    <section
      className={`flex flex-col items-stretch justify-between bg-cover bg-center bg-no-repeat`}
      style={{
        backgroundImage: `url('${props.backgroundUrl}')`,
      }}
    >
      {props.variant === "side" && <HeroSide {...props} />}
      {/* <div
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
              className={`text-4xl font-bold ${
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
      </div> */}
    </section>
  )
}

export default Hero
