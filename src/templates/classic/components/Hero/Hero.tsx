import type {
  HeroProps,
  HeroBackgroundImageProps,
  HeroKeyHighlightProps,
  HeroSideProps,
  HeroCenterProps,
  HeroFloatingProps,
  HeroImageProps,
} from "~/common/Hero"
import { HeroDropdown } from "./HeroDropdown"
import {
  HeroInfoboxDesktop,
  HeroInfoboxMobile,
  HeroInfoboxTablet,
} from "./HeroInfobox"

const BP_BUTTON_CLASSES =
  "rounded-none box-content appearance-none items-center border border-solid border-[#f0f0f0] shadow-none inline-flex text-base h-9 justify-center px-3 py-[calc(0.375rem-1px)] relative align-top select-none cursor-pointer text-center whitespace-nowrap focus:outline-none active:outline-none disabled:cursor-not-allowed"

const HeroSide = (
  props: Omit<
    HeroSideProps,
    keyof HeroBackgroundImageProps | keyof HeroKeyHighlightProps
  >,
) => {
  return (
    <div className="grow shrink-0">
      {/* Desktop view 768 above */}
      <div className="hidden md:block">
        <HeroInfoboxDesktop {...props} />
      </div>

      {/* Mobile view below 768 */}
      <div className="block md:hidden">
        <HeroInfoboxMobile {...props} />
      </div>
    </div>
  )
}

const HeroImage = ({
  dropdown,
}: Omit<
  HeroImageProps,
  keyof HeroBackgroundImageProps | keyof HeroKeyHighlightProps
>) => {
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
  props: Omit<
    HeroFloatingProps,
    keyof HeroBackgroundImageProps | keyof HeroKeyHighlightProps
  >,
) => {
  return (
    <div className="md:p-12">
      {/* Desktop view 1024 above */}
      <div className="hidden lg:block max-w-screen-xl mx-auto my-0">
        <HeroInfoboxDesktop {...props} />
      </div>

      {/* Tablet view 769 to 1023 */}
      <div className="hidden md:block lg:hidden mb-0">
        <HeroInfoboxTablet {...props} />
      </div>

      {/* Mobile view below 768 */}
      <div className="block md:hidden">
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
}: Omit<
  HeroCenterProps,
  keyof HeroBackgroundImageProps | keyof HeroKeyHighlightProps
>) => {
  return (
    <div className="grow shrink-0 bg-[##00000040] px-6 py-12">
      <div className="mx-auto mt-8 mb-0 relative">
        <div className="flex lg:min-h-80 lg:h-96 items-center justify-center">
          <div className="flex-none w-3/4 text-center text-white">
            <h1 className="text-6xl md:text-[5.25rem] md:leading-[5.25rem] font-bold -tracking-[0.09375rem] m-0 pb-8 text-balance">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden md:block pb-8 text-xl">{subtitle}</p>
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
                  className={`${BP_BUTTON_CLASSES} bg-site-secondary text-content-inverse border-transparent uppercase px-6 py-[7px] text-base tracking-wider font-semibold h-[2.4rem]`}
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

const HeroKeyHighlights = ({ keyHighlights }: HeroKeyHighlightProps) => {
  if (!keyHighlights || keyHighlights.length === 0) {
    return null
  }

  return (
    <section
      id="key-highlights"
      className="p-0 lg:px-6 bg-site-primary text-white"
    >
      <div className="mx-auto my-0 relative lg:max-w-[60rem] xl:max-w-[76rem] 2xl:max-w-[84rem]">
        <div className={`m-0 text-center justify-center flex-none md:flex`}>
          {keyHighlights
            .slice(0, 4)
            .map(
              ({
                url: highlightUrl,
                title: highlightTitle,
                description: highlightDescription,
              }) => (
                <div className="transition-colors hover:bg-site-primary-hover cursor-pointer grow basis-0 border-solid border-l first:border-l-0 border-l-subtitle">
                  <a
                    href={highlightUrl}
                    rel={
                      highlightUrl.startsWith("http")
                        ? "noopener noreferrer nofollow"
                        : ""
                    }
                    target={highlightUrl.startsWith("http") ? "_blank" : ""}
                  >
                    <div className="block px-8 py-5">
                      {highlightTitle && (
                        <p className="font-semibold text-white tracking-[0.0125rem] uppercase pt-1">
                          {highlightTitle}
                          {highlightUrl.startsWith("http") && (
                            <>
                              &ensp;
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                fill="currentColor"
                                className="text-2xl -mt-0.5 inline-block"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"
                                />
                                <path
                                  fill-rule="evenodd"
                                  d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"
                                />
                              </svg>
                            </>
                          )}
                        </p>
                      )}
                      {highlightDescription && (
                        <p className="color-[#ffffffb3] pb-2">
                          {highlightDescription}
                        </p>
                      )}
                    </div>
                  </a>
                </div>
              ),
            )}
        </div>
      </div>
    </section>
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
      {props.variant === "center" && <HeroCenter {...props} />}
      {(props.variant === "side" ||
        props.variant === "image" ||
        props.variant === "floating" ||
        props.variant === "center") &&
        props.keyHighlights && (
          <HeroKeyHighlights keyHighlights={props.keyHighlights} />
        )}
    </section>
  )
}

export default Hero
