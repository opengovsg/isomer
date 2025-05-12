import type { HeroProps } from "~/interfaces/complex/Hero"
import { HERO_STYLE } from "~/interfaces/complex/Hero"
import { getReferenceLinkHref, isExternalUrl } from "~/utils"
import { ComponentContent } from "../../internal/customCssClass"
import { LinkButton } from "../../internal/LinkButton/LinkButton"
import { ImageClient } from "../Image"

const HeroGradient = ({
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  backgroundUrl,
  site,
  LinkComponent,
}: HeroProps) => {
  const backgroundSrc =
    isExternalUrl(backgroundUrl) || site.assetsBaseUrl === undefined
      ? backgroundUrl
      : `${site.assetsBaseUrl}${backgroundUrl}`

  return (
    <section
      className="flex min-h-[15rem] bg-cover bg-center bg-no-repeat sm:min-h-[22.5rem] lg:min-h-[31.25rem]"
      style={{
        backgroundImage: `url('${backgroundSrc}')`,
      }}
    >
      <div className="w-full content-center bg-gradient-to-r from-[rgba(0,0,0,85%)] to-[rgba(0,0,0,10%)] xl:from-[rgba(0,0,0,100%)]">
        <div
          className={`${ComponentContent} flex flex-row justify-start py-16 text-start text-base-content-inverse`}
        >
          <div className="xl:max-w-50% flex w-full flex-col gap-9 sm:w-3/5">
            <div className="flex flex-col gap-6">
              <h1 className="prose-display-xl break-words">{title}</h1>
              {subtitle && <p className="prose-title-lg-regular">{subtitle}</p>}
            </div>
            {buttonLabel && buttonUrl && (
              <div className="flex flex-col justify-start gap-x-5 gap-y-4 sm:flex-row">
                <LinkButton
                  href={getReferenceLinkHref(
                    buttonUrl,
                    site.siteMap,
                    site.assetsBaseUrl,
                  )}
                  size="lg"
                  LinkComponent={LinkComponent}
                  isWithFocusVisibleHighlight
                >
                  {buttonLabel}
                </LinkButton>
                {secondaryButtonLabel && secondaryButtonUrl && (
                  <LinkButton
                    colorScheme="inverse"
                    variant="outline"
                    size="lg"
                    href={getReferenceLinkHref(
                      secondaryButtonUrl,
                      site.siteMap,
                      site.assetsBaseUrl,
                    )}
                    LinkComponent={LinkComponent}
                    isWithFocusVisibleHighlight
                  >
                    {secondaryButtonLabel}
                  </LinkButton>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

const HERO_THEME_MAPPINGS = {
  hero: {
    default: "bg-brand-canvas-inverse",
    inverse: "bg-brand-canvas-alt",
  },
  text: {
    default: "text-base-content-inverse",
    inverse: "text-base-content",
  },
  button: {
    default: "inverse",
    inverse: "default",
  },
} as const

const HeroBlock = ({
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  backgroundUrl,
  site,
  LinkComponent,
  theme = "default",
}: HeroProps) => {
  const backgroundSrc =
    isExternalUrl(backgroundUrl) || site.assetsBaseUrl === undefined
      ? backgroundUrl
      : `${site.assetsBaseUrl}${backgroundUrl}`

  const heroColour = HERO_THEME_MAPPINGS.hero[theme]
  const heroTextColour = HERO_THEME_MAPPINGS.text[theme]
  const heroButton = HERO_THEME_MAPPINGS.button[theme]

  return (
    <section className="flex min-h-[15rem] flex-col sm:min-h-[22.5rem] lg:min-h-[31.25rem] lg:flex-row">
      <div
        className={`flex flex-row ${heroColour} px-6 pb-12 pt-11 md:px-10 lg:w-1/2 lg:justify-end lg:pl-10 lg:pr-12`}
      >
        <div
          className={`flex w-full max-w-[532px] flex-col justify-center gap-9 ${heroTextColour}`}
        >
          <div className="flex flex-col gap-6">
            <h1 className="prose-display-xl break-words">{title}</h1>
            {subtitle && <p className="prose-title-lg-regular">{subtitle}</p>}
          </div>
          {buttonLabel && buttonUrl && (
            <div className="flex flex-col justify-start gap-x-5 gap-y-4 sm:flex-row">
              <LinkButton
                href={getReferenceLinkHref(
                  buttonUrl,
                  site.siteMap,
                  site.assetsBaseUrl,
                )}
                size="lg"
                variant="solid"
                colorScheme="inverse"
                LinkComponent={LinkComponent}
                isWithFocusVisibleHighlight
              >
                {buttonLabel}
              </LinkButton>
              {secondaryButtonLabel && secondaryButtonUrl && (
                <LinkButton
                  colorScheme={heroButton}
                  variant="outline"
                  size="lg"
                  href={getReferenceLinkHref(
                    secondaryButtonUrl,
                    site.siteMap,
                    site.assetsBaseUrl,
                  )}
                  LinkComponent={LinkComponent}
                  isWithFocusVisibleHighlight
                >
                  {secondaryButtonLabel}
                </LinkButton>
              )}
            </div>
          )}
        </div>
      </div>
      <div
        className="h-80 bg-cover bg-center bg-no-repeat lg:h-auto lg:max-h-full lg:w-1/2"
        style={{
          backgroundImage: `url('${backgroundSrc}')`,
        }}
      />
    </section>
  )
}

const HeroLargeImage = ({
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  backgroundUrl,
  site,
  LinkComponent,
}: HeroProps) => {
  const backgroundSrc =
    isExternalUrl(backgroundUrl) || site.assetsBaseUrl === undefined
      ? backgroundUrl
      : `${site.assetsBaseUrl}${backgroundUrl}`

  return (
    <section className="flex w-full flex-col">
      <div
        className={`mx-auto flex w-full flex-col gap-5 px-6 pb-12 pt-10 md:gap-9 lg:pb-16 lg:pt-12 ${ComponentContent}`}
      >
        {/* Text container */}
        <div className="m:gap-6 flex flex-col items-center gap-5 text-base-content-strong sm:items-start md:text-center lg:mx-auto lg:max-w-[66.67%]">
          <h1 className="prose-display-xl w-full">{title}</h1>
          {subtitle && (
            <p className="prose-title-lg-regular w-full">{subtitle}</p>
          )}
        </div>
        {/* Button container */}
        {buttonLabel && buttonUrl && (
          <div className="flex flex-col items-start justify-center gap-x-5 gap-y-4 md:flex-row md:items-center">
            <LinkButton
              href={getReferenceLinkHref(
                buttonUrl,
                site.siteMap,
                site.assetsBaseUrl,
              )}
              size="lg"
              LinkComponent={LinkComponent}
              isWithFocusVisibleHighlight
            >
              {buttonLabel}
            </LinkButton>
            {secondaryButtonLabel && secondaryButtonUrl && (
              <LinkButton
                variant="outline"
                size="lg"
                href={getReferenceLinkHref(
                  secondaryButtonUrl,
                  site.siteMap,
                  site.assetsBaseUrl,
                )}
                LinkComponent={LinkComponent}
                isWithFocusVisibleHighlight
              >
                {secondaryButtonLabel}
              </LinkButton>
            )}
          </div>
        )}
      </div>
      <ImageClient
        src={backgroundSrc}
        alt={title}
        width="100%"
        className="aspect-square max-h-[60rem] w-full object-fill md:aspect-[2/1]"
      />
    </section>
  )
}

const HeroFloating = ({
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  backgroundUrl,
  site,
  LinkComponent,
  theme = "default",
}: HeroProps) => {
  const backgroundSrc =
    isExternalUrl(backgroundUrl) || site.assetsBaseUrl === undefined
      ? backgroundUrl
      : `${site.assetsBaseUrl}${backgroundUrl}`

  return (
    <section className="flex w-full flex-col items-center">
      {/* Image with aspect ratio and max height */}
      <div
        className="aspect-square max-h-[960px] w-full bg-cover bg-center sm:aspect-[2/1]"
        style={{ backgroundImage: `url('${backgroundSrc}')` }}
      />
      {/* Text container */}
      <div className="relative z-10 mx-auto -mt-16 w-full max-w-[896px] px-6 sm:-mt-24 md:px-10">
        <div
          className={`flex flex-col items-center gap-6 rounded-xl bg-white/90 py-12 shadow-lg backdrop-blur-sm sm:py-16`}
        >
          <h1 className="prose-display-xl break-words text-center">{title}</h1>
          {subtitle && (
            <p className="prose-title-lg-regular text-center">{subtitle}</p>
          )}
          {buttonLabel && buttonUrl && (
            <div className="flex flex-col justify-start gap-x-5 gap-y-4 sm:flex-row">
              <LinkButton
                href={getReferenceLinkHref(
                  buttonUrl,
                  site.siteMap,
                  site.assetsBaseUrl,
                )}
                size="lg"
                LinkComponent={LinkComponent}
                isWithFocusVisibleHighlight
              >
                {buttonLabel}
              </LinkButton>
              {secondaryButtonLabel && secondaryButtonUrl && (
                <LinkButton
                  variant="outline"
                  size="lg"
                  href={getReferenceLinkHref(
                    secondaryButtonUrl,
                    site.siteMap,
                    site.assetsBaseUrl,
                  )}
                  LinkComponent={LinkComponent}
                  isWithFocusVisibleHighlight
                >
                  {secondaryButtonLabel}
                </LinkButton>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

const Hero = (props: HeroProps) => {
  switch (props.variant) {
    case HERO_STYLE.gradient:
      return <HeroGradient {...props} />
    case HERO_STYLE.block:
      return <HeroBlock {...props} />
    case HERO_STYLE.largeImage:
      return <HeroLargeImage {...props} />
    case HERO_STYLE.floating:
      return <HeroFloating {...props} />
    default:
      const _exhaustiveCheck: never = props.variant
      return _exhaustiveCheck
  }
}

export default Hero
