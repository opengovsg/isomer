import {
  type HeroGradientProps,
  type HeroSplitProps,
  type HeroFloatingProps,
  type HeroCopyLedProps,
  type HeroFloatingImageProps,
} from "~/common/Hero"
import Button from "../Button"

export type HeroProps =
  | HeroGradientProps
  | HeroSplitProps
  | HeroFloatingProps
  | HeroCopyLedProps
  | HeroFloatingImageProps

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
      className="bg-cover bg-center bg-no-repeat h-[32rem]"
      style={{
        backgroundImage: `url('${backgroundUrl}')`,
      }}
    >
      <div
        className={`h-full w-full ${
          alignment === "left" ? "bg-gradient-to-r" : "bg-gradient-to-l"
        } from-[rgba(0,0,0,85%)] md:from-[rgba(0,0,0,75%)] xl:from-[rgba(0,0,0,65%)]`}
      >
        <div
          className={`text-white p-10 flex flex-row items-end h-full ${
            alignment === "left" ? "justify-start" : "justify-end"
          } ${alignment === "left" ? "text-start" : "text-end"}`}
        >
          <div className="flex flex-col w-full sm:w-3/5 xl:w-2/5 gap-6">
            <h1 className="text-4xl xl:text-6xl font-medium">{title}</h1>
            {subtitle && (
              <p className="text-lg xl:text-2xl leading-9">{subtitle}</p>
            )}
            {buttonLabel && buttonUrl && (
              <div
                className={`flex flex-row gap-4 ${
                  alignment === "left" ? "justify-start" : "justify-end"
                }`}
              >
                <Button
                  colorVariant="white"
                  label={buttonLabel}
                  href={buttonUrl}
                />
                {secondaryButtonLabel && secondaryButtonUrl && (
                  <Button
                    colorVariant="black"
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
        className={`hidden md:flex h-[32rem] ${
          alignment === "left" ? "flex-row" : "flex-row-reverse"
        }`}
      >
        <div className={`h-full w-1/2 ${bgColor}`}>
          <div
            className={`flex flex-row p-10 items-center h-full ${
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
                    colorVariant="white"
                    label={buttonLabel}
                    href={buttonUrl}
                  />
                  {secondaryButtonLabel && secondaryButtonUrl && (
                    <Button
                      colorVariant="black"
                      label={secondaryButtonLabel}
                      href={secondaryButtonUrl}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="h-full w-1/2">
          <div
            className="bg-cover bg-center bg-no-repeat h-full"
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
    <section className="h-[32rem]">
      <div
        className="bg-cover bg-center bg-no-repeat h-full"
        style={{
          backgroundImage: `url('${backgroundUrl}')`,
        }}
      >
        <div
          className={`flex flex-row px-28 py-16 items-center justify-center text-center h-full w-full ${
            alignment === "left"
              ? "md:justify-start md:text-start"
              : "md:justify-end md:text-end"
          }`}
        >
          <div
            className={`p-10 flex flex-col gap-6 ${bgColor} ${textColor} md:w-2/3 lg:w-1/2`}
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
                  colorVariant="white"
                  label={buttonLabel}
                  href={buttonUrl}
                />
                {secondaryButtonLabel && secondaryButtonUrl && (
                  <Button
                    colorVariant="black"
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
    <section className="h-[32rem]">
      <div className="bg-[#ffeec2] w-full flex flex-row justify-center">
        <div className="w-4/5 lg:w-3/4 py-16 flex flex-col items-center text-center md:items-start md:text-start gap-6">
          <h1 className="text-6xl font-normal">{title}</h1>
          {subtitle && <p className="text-2xl leading-9">{subtitle}</p>}
          {buttonLabel && buttonUrl && (
            <div className="flex flex-row gap-4">
              <Button
                colorVariant="white"
                label={buttonLabel}
                href={buttonUrl}
              />
              {secondaryButtonLabel && secondaryButtonUrl && (
                <Button
                  colorVariant="black"
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
          className="bg-cover bg-center bg-no-repeat h-3/5"
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
      <section className="hidden md:block h-[32rem]">
        <div className="bg-[#ffeec2] w-full flex flex-row justify-center">
          <div className="w-4/5 lg:w-3/4 py-16 flex flex-row gap-24">
            <div className="flex flex-col w-1/2 gap-6">
              <h1 className="text-6xl font-medium">{title}</h1>
              {subtitle && <p>{subtitle}</p>}
              {buttonLabel && buttonUrl && (
                <div className="flex flex-row gap-4">
                  <Button
                    colorVariant="white"
                    label={buttonLabel}
                    href={buttonUrl}
                  />
                  {secondaryButtonLabel && secondaryButtonUrl && (
                    <Button
                      colorVariant="black"
                      label={secondaryButtonLabel}
                      href={secondaryButtonUrl}
                    />
                  )}
                </div>
              )}
            </div>
            <div className="w-1/2 self-center">
              <img
                className="object-cover h-full w-full max-h-[24rem]"
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
