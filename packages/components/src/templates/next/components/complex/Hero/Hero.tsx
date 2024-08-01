import type { HeroProps } from "~/interfaces/complex/Hero"
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
}: HeroProps) => {
  return (
    <section
      className="flex min-h-[15rem] bg-cover bg-center bg-no-repeat sm:min-h-[22.5rem] md:min-h-[31.25rem]"
      style={{
        backgroundImage: `url('${backgroundUrl}')`,
      }}
    >
      <div className="w-full content-center bg-gradient-to-r from-[rgba(0,0,0,95%)] to-[rgba(0,0,0,70%)] md:from-[rgba(0,0,0,75%)] xl:from-[rgba(0,0,0,95%)]">
        <div
          className={`${ComponentContent} flex flex-row justify-start p-10 text-start text-white`}
        >
          <div className="flex w-full flex-col gap-6 sm:w-3/5 xl:max-w-[520px]">
            <h1 className="font-bold text-heading-01">{title}</h1>
            {subtitle && <p className="text-paragraph-01">{subtitle}</p>}
            {buttonLabel && buttonUrl && (
              <div className="flex flex-row justify-start gap-4">
                <LinkButton href={buttonUrl}>{buttonLabel}</LinkButton>
                {secondaryButtonLabel && secondaryButtonUrl && (
                  <LinkButton
                    colorScheme="inverse"
                    variant="outline"
                    href={secondaryButtonUrl}
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
