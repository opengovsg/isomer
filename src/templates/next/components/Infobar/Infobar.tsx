import { InfobarProps } from "~/common"
import Button from "../Button"

const Infobar = ({
  sectionIdx,
  title,
  description,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
}: InfobarProps) => {
  return (
    <section className="py-16 px-5 sm:px-14 lg:py-24">
      <div className="flex flex-col gap-12 items-center mx-auto text-center lg:max-w-3xl">
        <div className="flex flex-col gap-7">
          <h1 className="text-content-default text-4xl leading-tight font-semibold lg:text-5xl lg:leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-content-default text-xl">{description}</p>
          )}
        </div>
        <div className="flex flex-row gap-6">
          {buttonLabel && buttonUrl && (
            <Button label={buttonLabel} href={buttonUrl} />
          )}
          {secondaryButtonLabel && secondaryButtonUrl && (
            <Button
              label={secondaryButtonLabel}
              href={secondaryButtonUrl}
              colorVariant="white"
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default Infobar
