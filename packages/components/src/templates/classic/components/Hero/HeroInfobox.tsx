import type {
  HeroFloatingProps,
  HeroInfoboxProps,
  HeroSideProps,
} from "~/interfaces/complex/Hero"
import { HeroDropdown } from "./HeroDropdown"

type HeroInfoboxVariants =
  | HeroSideProps["variant"]
  | HeroFloatingProps["variant"]

const BP_BUTTON_CLASSES =
  "rounded-none box-content appearance-none items-center border border-solid border-[#f0f0f0] shadow-none inline-flex text-base h-9 justify-center px-3 py-[calc(0.375rem-1px)] relative align-top select-none cursor-pointer text-center whitespace-nowrap focus:outline-none active:outline-none disabled:cursor-not-allowed"

const bgColor: {
  [key in NonNullable<HeroInfoboxProps["backgroundColor"]>]: string
} = {
  black: "bg-canvas-inverse",
  white: "bg-canvas-base",
  gray: "bg-canvas-translucentGrey",
}

const textColor: {
  [key in NonNullable<HeroInfoboxProps["backgroundColor"]>]: string
} = {
  black: "text-content-inverse",
  white: "text-content-default",
  gray: "text-content-inverse",
}

const width: {
  [key in HeroInfoboxVariants]: {
    [key in NonNullable<HeroInfoboxProps["size"]>]: string
  }
} = {
  side: {
    sm: "w-min w-1/3 xl:w-1/2",
    md: "w-1/2",
  },
  floating: {
    sm: "w-1/3",
    md: "w-1/2",
  },
}

const padding: {
  [key in HeroInfoboxVariants]: {
    [key in NonNullable<HeroInfoboxProps["size"]>]: string
  }
} = {
  side: {
    sm: "p-16",
    md: "p-16",
  },
  floating: {
    sm: "p-8 xl:p-16",
    md: "p-16",
  },
}

export const HeroInfoboxDesktop = ({
  variant,
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  alignment,
  backgroundColor = "white",
  size = "md",
  dropdown,
}: HeroInfoboxProps & { variant: HeroInfoboxVariants }) => {
  return (
    <div
      className={`flex ${
        alignment === "right" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex flex-col ${padding[variant][size]} ${bgColor[backgroundColor]} ${width[variant][size]}`}
      >
        <div
          className={`flex flex-col ${
            variant === "side" ? "w-full max-w-xl" : null
          } self-${alignment === "right" ? "start" : "end"}`}
        >
          <div className="mb-8 flex flex-col">
            <h1
              className={`mb-4 text-[2.75rem] font-bold not-italic leading-[3.5rem] -tracking-[0.0605rem] lg:text-5xl lg:-tracking-[0.066rem] ${textColor[backgroundColor]}`}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className={`hidden text-lg font-normal not-italic lg:block ${textColor[backgroundColor]}`}
              >
                {subtitle}
              </p>
            )}
          </div>
          {dropdown && !buttonLabel && !buttonUrl && (
            <div className="flex w-full content-center justify-center">
              <HeroDropdown {...dropdown} />
            </div>
          )}
          {buttonLabel && buttonUrl && !dropdown && (
            <div>
              {/* <Button label={buttonLabel} /> */}
              <a
                href={buttonUrl}
                rel={
                  buttonUrl.startsWith("http")
                    ? "noopener noreferrer nofollow"
                    : ""
                }
                target={buttonUrl.startsWith("http") ? "_blank" : ""}
                className={`${BP_BUTTON_CLASSES} h-[2.4rem] border-transparent bg-site-secondary px-6 py-[7px] text-base font-semibold uppercase tracking-wider text-content-inverse`}
              >
                {buttonLabel}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const HeroInfoboxTablet = ({
  title,
  buttonLabel,
  buttonUrl,
  alignment,
  backgroundColor = "white",
  dropdown,
}: HeroInfoboxProps) => {
  // TODO: Tablet view is quite jank but it seems like this was the design previously
  return (
    <div className={`p-8 ${bgColor[backgroundColor]}`}>
      <div
        className={`flex ${
          alignment === "right" ? "justify-end" : "justify-start"
        }`}
      >
        <div className="flex flex-col">
          <div className="mb-8">
            <h1
              className={`mb-4 text-[2.75rem] font-bold not-italic leading-[3.5rem] -tracking-[0.0605rem] lg:text-5xl lg:-tracking-[0.066rem] ${textColor[backgroundColor]}`}
            >
              {title}
            </h1>
          </div>
          <div
            className={`flex content-center ${
              alignment === "right" ? "justify-end" : "justify-start"
            }`}
          >
            {dropdown && !buttonLabel && !buttonUrl && (
              <HeroDropdown {...dropdown} />
            )}
            {buttonLabel && buttonUrl && !dropdown && (
              <div>
                {/* <Button label={buttonLabel} /> */}
                <a
                  href={buttonUrl}
                  rel={
                    buttonUrl.startsWith("http")
                      ? "noopener noreferrer nofollow"
                      : ""
                  }
                  target={buttonUrl.startsWith("http") ? "_blank" : ""}
                  className={`${BP_BUTTON_CLASSES} h-[2.4rem] border-transparent bg-site-secondary px-6 py-[7px] text-base font-semibold uppercase tracking-wider text-content-inverse`}
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

export const HeroInfoboxMobile = ({
  title,
  buttonLabel,
  buttonUrl,
  backgroundColor = "white",
  dropdown,
}: HeroInfoboxProps) => {
  return (
    <div className="m-auto mb-0 items-center px-12 py-[6.625rem]">
      <div
        className={`m-auto flex w-3/4 min-w-96 flex-none flex-col items-center px-12 py-8 ${bgColor[backgroundColor]}`}
      >
        <div className="mb-8 text-center">
          <h1
            className={`mb-4 text-[2.75rem] font-bold not-italic leading-[3.5rem] -tracking-[0.0605rem] lg:text-5xl lg:-tracking-[0.066rem] ${textColor[backgroundColor]}`}
          >
            {title}
          </h1>
          {dropdown && !buttonLabel && !buttonUrl && (
            <HeroDropdown {...dropdown} />
          )}
          {buttonLabel && buttonUrl && !dropdown && (
            <div>
              {/* <Button label={buttonLabel} /> */}
              <a
                href={buttonUrl}
                rel={
                  buttonUrl.startsWith("http")
                    ? "noopener noreferrer nofollow"
                    : ""
                }
                target={buttonUrl.startsWith("http") ? "_blank" : ""}
                className={`${BP_BUTTON_CLASSES} h-[2.4rem] border-transparent bg-site-secondary px-6 py-[7px] text-base font-semibold uppercase tracking-wider text-content-inverse`}
              >
                {buttonLabel}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
