import type { HeroProps } from "~/interfaces/complex/Hero"
import { getReferenceLinkHref } from "~/utils"
import { ComponentContent } from "../../internal/customCssClass"
import { LinkButton } from "../../internal/LinkButton/LinkButton"

const Hero = ({
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
  return (
    <section
      className="flex min-h-[15rem] bg-cover bg-center bg-no-repeat sm:min-h-[22.5rem] lg:min-h-[31.25rem]"
      style={{
        backgroundImage: `url('${backgroundUrl}')`,
      }}
    >
      <div className="w-full content-center bg-gradient-to-r from-[rgba(0,0,0,85%)] to-[rgba(0,0,0,10%)] xl:from-[rgba(0,0,0,100%)]">
        <div
          className={`${ComponentContent} flex flex-row justify-start py-16 text-start text-base-content-inverse`}
        >
          <div className="xl:max-w-50% flex w-full flex-col gap-9 sm:w-3/5">
            <div className="flex flex-col gap-6">
              <h1 className="prose-display-xl break-words">{title}</h1>
              {subtitle && <p className="prose-body-base">{subtitle}</p>}
            </div>
            {buttonLabel && buttonUrl && (
              <div className="flex flex-col justify-start gap-x-5 gap-y-4 sm:flex-row">
                <LinkButton
                  href={getReferenceLinkHref(buttonUrl, site.siteMap)}
                  size="lg"
                  LinkComponent={LinkComponent}
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
                    )}
                    LinkComponent={LinkComponent}
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

export default Hero
