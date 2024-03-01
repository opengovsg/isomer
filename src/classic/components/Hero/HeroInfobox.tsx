import {
  type HeroFloatingProps,
  type HeroInfoboxProps,
  type HeroSideProps,
} from "~/common/Hero"
import { HeroDropdown } from "./HeroDropdown"

const BP_BUTTON_CLASSES =
  "rounded-none box-content appearance-none items-center border border-solid border-[#f0f0f0] shadow-none inline-flex text-base h-9 justify-center px-3 py-[calc(0.375rem-1px)] relative align-top select-none cursor-pointer text-center whitespace-nowrap focus:outline-none active:outline-none disabled:cursor-not-allowed"

export const HeroInfobox = ({
  variant,
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  alignment,
  backgroundColor = "white",
  size = "md",
  dropdown,
}: HeroInfoboxProps & {
  variant: HeroSideProps["variant"] | HeroFloatingProps["variant"]
}) => {
  const bgColor: { [key in typeof backgroundColor]: string } = {
    black: "bg-canvas-inverse",
    white: "bg-canvas-base",
    gray: "bg-canvas-translucentGrey",
  }

  const textColor: { [key in typeof backgroundColor]: string } = {
    black: "text-content-inverse",
    white: "text-content-base",
    gray: "text-content-inverse",
  }

  const width: { [key in typeof variant]: { [key in typeof size]: string } } = {
    side: {
      sm: "w-min w-1/3 xl:w-1/2",
      md: "w-1/2",
    },
    floating: {
      sm: "w-1/3",
      md: "w-1/2",
    },
  }

  return (
    <>
      {/* Desktop view 768 above */}
      <div className="invisible md:visible hidden md:block">
        <div
          className={`flex ${
            alignment === "right" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`flex flex-col p-16 ${bgColor[backgroundColor]} ${width[variant][size]}`}
          >
            <div
              className={`flex flex-col ${
                variant === "side" ? "w-full max-w-xl" : null
              } self-${alignment === "right" ? "start" : "end"}`}
            >
              <div className="flex flex-col mb-8">
                <h1
                  className={`mb-4 text-[2.75rem] lg:text-5xl not-italic font-bold leading-[3.5rem] -tracking-[0.0605rem] lg:-tracking-[0.066rem] ${textColor[backgroundColor]}`}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p
                    className={`invisible lg:visible text-lg not-italic font-normal ${textColor[backgroundColor]}`}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
              {dropdown && !buttonLabel && !buttonUrl && (
                <div className="flex w-full justify-center content-center">
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
                    className={`${BP_BUTTON_CLASSES} bg-secondary text-content-inverse border-transparent uppercase px-6 py-[7px] text-base tracking-wider font-semibold h-[2.4rem]`}
                  >
                    {buttonLabel}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile view below 768 */}
      <div className="visible md:invisible block md:hidden mb-0 m-auto items-center px-12 py-[6.625rem]">
        <div
          className={`flex flex-col flex-none py-8 px-12 m-auto items-center w-3/4 min-w-96 ${bgColor[backgroundColor]}`}
        >
          <div className="mb-8 text-center">
            <h1
              className={`mb-4 text-[2.75rem] lg:text-5xl not-italic font-bold leading-[3.5rem] -tracking-[0.0605rem] lg:-tracking-[0.066rem] ${textColor[backgroundColor]}`}
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
                  className={`${BP_BUTTON_CLASSES} bg-secondary text-content-inverse border-transparent uppercase px-6 py-[7px] text-base tracking-wider font-semibold h-[2.4rem]`}
                >
                  {buttonLabel}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
