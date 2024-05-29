import type {
  HeroCopyLedProps,
  HeroFloatingImageProps,
  HeroFloatingProps,
  HeroGradientProps,
  HeroProps,
  HeroSplitProps,
} from "~/interfaces/complex/Hero"
import { ComponentContent } from "../../internal/customCssClass"
import Button from "../Button"

const HeroGradient = ({
  alignment = "left",
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  backgroundUrl,
}: HeroGradientProps) => {
  return (
    <section
      className="flex min-h-[15rem] bg-cover bg-center bg-no-repeat sm:min-h-[22.5rem] md:min-h-[31.25rem]"
      style={{
        backgroundImage: `url('${backgroundUrl}')`,
      }}
    >
      <div
        className={`w-full content-center ${
          alignment === "left" ? "bg-gradient-to-r" : "bg-gradient-to-l"
        } from-[rgba(0,0,0,95%)] to-[rgba(0,0,0,70%)] md:from-[rgba(0,0,0,75%)] xl:from-[rgba(0,0,0,95%)]`}
      >
        <div
          className={`${ComponentContent} flex flex-row p-10 text-white ${
            alignment === "left" ? "justify-start" : "justify-end"
          } ${alignment === "left" ? "text-start" : "text-end"}`}
        >
          <div className="flex w-full flex-col gap-6 sm:w-3/5 xl:max-w-[520px]">
            <h1 className="text-heading-01 font-bold">{title}</h1>
            {subtitle && <p className="text-paragraph-01">{subtitle}</p>}
            {buttonLabel && buttonUrl && (
              <div
                className={`flex flex-row gap-4 ${
                  alignment === "left" ? "justify-start" : "justify-end"
                }`}
              >
                <Button
                  colorScheme="white"
                  label={buttonLabel}
                  href={buttonUrl}
                />
                {secondaryButtonLabel && secondaryButtonUrl && (
                  <Button
                    colorScheme="white"
                    variant="outline"
                    label={secondaryButtonLabel}
                    href={secondaryButtonUrl}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

const HeroSplit = ({
  alignment = "left",
  backgroundColor = "black",
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  backgroundUrl,
}: HeroSplitProps) => {
  const bgColor = backgroundColor === "black" ? "bg-canvas-dark" : "bg-white"
  const textColor = backgroundColor === "black" ? "text-white" : "text-black"

  return (
    <>
      <section
        className={`hidden min-h-[15rem] sm:min-h-[22.5rem] md:flex md:min-h-[31.25rem] ${
          alignment === "left" ? "flex-row" : "flex-row-reverse"
        }`}
      >
        <div className={`w-1/2 ${bgColor} content-end`}>
          <div
            className={`flex flex-row items-center p-10 ${
              alignment === "left"
                ? "justify-start text-start"
                : "justify-end text-end"
            } ${textColor}`}
          >
            <div className="flex flex-col gap-6">
              <h1 className="text-6xl font-medium">{title}</h1>
              {subtitle && <p className="text-2xl leading-9">{subtitle}</p>}
              {buttonLabel && buttonUrl && (
                <div
                  className={`flex flex-row gap-4 ${
                    alignment === "left" ? "justify-start" : "justify-end"
                  }`}
                >
                  <Button
                    colorScheme="white"
                    label={buttonLabel}
                    href={buttonUrl}
                  />
                  {secondaryButtonLabel && secondaryButtonUrl && (
                    <Button
                      colorScheme="white"
                      variant="outline"
                      label={secondaryButtonLabel}
                      href={secondaryButtonUrl}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-1/2">
          <div
            className="h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('${backgroundUrl}')`,
            }}
          ></div>
        </div>
      </section>
      <section className="block md:hidden">
        <HeroFloating
          backgroundColor={backgroundColor}
          title={title}
          subtitle={subtitle}
          buttonLabel={buttonLabel}
          buttonUrl={buttonUrl}
          secondaryButtonLabel={secondaryButtonLabel}
          secondaryButtonUrl={secondaryButtonUrl}
          backgroundUrl={backgroundUrl}
        />
      </section>
    </>
  )
}

const HeroFloating = ({
  alignment = "left",
  backgroundColor = "black",
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  backgroundUrl,
}: Omit<HeroFloatingProps, "variant">) => {
  const bgColor = backgroundColor === "black" ? "bg-canvas-dark" : "bg-white"
  const textColor = backgroundColor === "black" ? "text-white" : "text-black"

  return (
    <section className="flex min-h-[15rem] sm:min-h-[22.5rem] md:min-h-[31.25rem]">
      <div
        className="w-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${backgroundUrl}')`,
        }}
      >
        <div
          className={`${ComponentContent} flex h-full w-full flex-row items-center justify-center px-28 py-16 text-center ${
            alignment === "left"
              ? "md:justify-start md:text-start"
              : "md:justify-end md:text-end"
          }`}
        >
          <div
            className={`flex flex-col gap-6 p-10 ${bgColor} ${textColor} md:w-2/3 lg:w-1/2`}
          >
            <h1 className="text-6xl font-medium">{title}</h1>
            {subtitle && <p>{subtitle}</p>}
            {buttonLabel && buttonUrl && (
              <div
                className={`flex flex-row gap-4 ${
                  alignment === "left"
                    ? "justify-center md:justify-start"
                    : "justify-center md:justify-end"
                }`}
              >
                <Button
                  colorScheme="white"
                  label={buttonLabel}
                  href={buttonUrl}
                />
                {secondaryButtonLabel && secondaryButtonUrl && (
                  <Button
                    colorScheme="white"
                    variant="outline"
                    label={secondaryButtonLabel}
                    href={secondaryButtonUrl}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

const HeroCopyLed = ({
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  backgroundUrl,
}: Omit<HeroCopyLedProps, "variant">) => {
  return (
    <section className="h-px min-h-[15rem] sm:min-h-[22.5rem] md:min-h-[31.25rem]">
      <div className="bg-site-primary-200 flex w-full flex-row justify-center">
        <div
          className={`${ComponentContent} flex w-4/5 flex-col items-center gap-6 py-16 text-center md:items-start md:text-start lg:w-3/4`}
        >
          <h1 className="text-6xl font-normal">{title}</h1>
          {subtitle && <p className="text-2xl leading-9">{subtitle}</p>}
          {buttonLabel && buttonUrl && (
            <div className="flex flex-row gap-4">
              <Button
                colorScheme="black"
                label={buttonLabel}
                href={buttonUrl}
              />
              {secondaryButtonLabel && secondaryButtonUrl && (
                <Button
                  colorScheme="black"
                  variant="outline"
                  label={secondaryButtonLabel}
                  href={secondaryButtonUrl}
                />
              )}
            </div>
          )}
        </div>
      </div>
      {backgroundUrl && (
        <div
          className="h-3/5 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${backgroundUrl}')`,
          }}
        ></div>
      )}
    </section>
  )
}

const HeroFloatingImage = ({
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  backgroundUrl,
}: HeroFloatingImageProps) => {
  return (
    <>
      <section className="hidden min-h-[15rem] sm:min-h-[22.5rem] md:block md:min-h-[31.25rem]">
        <div className="bg-site-primary-200 flex w-full flex-row justify-center">
          <div
            className={`${ComponentContent} flex w-4/5 flex-row gap-24 py-16 lg:w-3/4`}
          >
            <div className="flex w-1/2 flex-col gap-6">
              <h1 className="text-6xl font-medium">{title}</h1>
              {subtitle && <p>{subtitle}</p>}
              {buttonLabel && buttonUrl && (
                <div className="flex flex-row gap-4">
                  <Button
                    colorScheme="black"
                    label={buttonLabel}
                    href={buttonUrl}
                  />
                  {secondaryButtonLabel && secondaryButtonUrl && (
                    <Button
                      colorScheme="black"
                      variant="outline"
                      label={secondaryButtonLabel}
                      href={secondaryButtonUrl}
                    />
                  )}
                </div>
              )}
            </div>
            <div className="w-1/2 self-center">
              <img
                className="h-full max-h-[24rem] w-full object-cover"
                src={backgroundUrl}
              />
            </div>
          </div>
        </div>
      </section>
      <section className="block md:hidden">
        <HeroCopyLed
          title={title}
          subtitle={subtitle}
          buttonLabel={buttonLabel}
          buttonUrl={buttonUrl}
          secondaryButtonLabel={secondaryButtonLabel}
          secondaryButtonUrl={secondaryButtonUrl}
        />
      </section>
    </>
  )
}

const Hero = (props: HeroProps) => {
  return (
    <>
      {props.variant === "gradient" && <HeroGradient {...props} />}
      {props.variant === "split" && <HeroSplit {...props} />}
      {props.variant === "floating" && <HeroFloating {...props} />}
      {props.variant === "copyled" && <HeroCopyLed {...props} />}
      {props.variant === "floatingimage" && <HeroFloatingImage {...props} />}
    </>
  )
}

export default Hero
