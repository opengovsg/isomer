import {
  type HeroCommonProps,
  type HeroSideProps,
  type HeroProps,
  type HeroCenterProps,
  type HeroFloatingProps,
  type HeroImageProps,
} from "~/common/Hero"
import { HeroDropdown } from "./HeroDropdown"
import {
  HeroInfoboxDesktop,
  HeroInfoboxMobile,
  HeroInfoboxTablet,
} from "./HeroInfobox"

const BP_BUTTON_CLASSES =
  "rounded-none box-content appearance-none items-center border border-solid border-[#f0f0f0] shadow-none inline-flex text-base h-9 justify-center px-3 py-[calc(0.375rem-1px)] relative align-top select-none cursor-pointer text-center whitespace-nowrap focus:outline-none active:outline-none disabled:cursor-not-allowed"

const HeroSide = (props: Omit<HeroSideProps, keyof HeroCommonProps>) => {
  return (
    <div className="grow shrink-0">
      {/* Desktop view 768 above */}
      <div className="invisible md:visible hidden md:block">
        <HeroInfoboxDesktop {...props} />
      </div>

      {/* Mobile view below 768 */}
      <div className="visible md:invisible block md:hidden">
        <HeroInfoboxMobile {...props} />
      </div>
    </div>
  )
}

const HeroImage = ({
  dropdown,
}: Omit<HeroImageProps, keyof HeroCommonProps>) => {
  return (
    <div className="grow shrink-0 px-6 py-12">
      <div className="mx-auto mt-8 mb-0">
        <div className="flex min-h-[398px] w-11/12 md:w-5/6 lg:w-2/3 mx-auto items-center justify-center">
          {dropdown && (
            <div className="block basis-0 grow shrink p-3 max-w-full">
              <HeroDropdown {...dropdown} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const HeroFloating = (
  props: Omit<HeroFloatingProps, keyof HeroCommonProps>,
) => {
  return (
    <div className="md:p-12">
      {/* Desktop view 1024 above */}
      <div className="invisible lg:visible hidden lg:block max-w-screen-xl mx-auto my-0">
        <HeroInfoboxDesktop {...props} />
      </div>

      {/* Tablet view 769 to 1023 */}
      <div className="invisible md:visible lg:invisible hidden md:block lg:hidden mb-0">
        <HeroInfoboxTablet {...props} />
      </div>

      {/* Mobile view below 768 */}
      <div className="visible md:invisible block md:hidden">
        <HeroInfoboxMobile {...props} />
      </div>
    </div>
  )
}

const HeroCenter = ({
  title,
  subtitle,
  dropdown,
  buttonLabel,
  buttonUrl,
}: Omit<HeroCenterProps, keyof HeroCommonProps>) => {
  return (
    <div className="grow shrink-0 bg-[##00000040] px-6 py-12">
      <div className="mx-auto mt-8 mb-0 relative">
        <div className="flex lg:min-h-80 lg:h-96 items-center justify-center">
          <div className="flex-none w-3/4 text-center text-white">
            <h1 className="text-[5.25rem] leading-[5.25rem] font-bold -tracking-[0.09375rem] m-0 pb-8 text-balance">
              {title}
            </h1>
            {subtitle && (
              <p className="invisible md:visible hidden md:block pb-8 text-xl">
                {subtitle}
              </p>
            )}
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
      {props.variant === "image" && <HeroImage {...props} />}
      {props.variant === "floating" && <HeroFloating {...props} />}
      {props.variant !== "side" &&
        props.variant !== "image" &&
        props.variant !== "floating" && <HeroCenter {...props} />}
    </section>
  )
}

export default Hero
