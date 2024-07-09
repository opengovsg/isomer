import type { InfobarProps } from "~/interfaces"
import { ComponentContent } from "../../internal/customCssClass"
import Button from "../Button"

const Infobar = ({
  title,
  description,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  LinkComponent,
}: InfobarProps) => {
  return (
    <section>
      <div
        className={`${ComponentContent} mx-auto flex flex-col items-center gap-12 py-16 text-center lg:max-w-3xl lg:py-24`}
      >
        <div className="flex flex-col gap-7">
          <h1 className="text-content text-4xl font-semibold leading-tight lg:text-5xl lg:leading-tight">
            {title}
          </h1>
          {description && <p className="text-content text-xl">{description}</p>}
        </div>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          {buttonLabel && buttonUrl && (
            <Button
              label={buttonLabel}
              href={buttonUrl}
              LinkComponent={LinkComponent}
            />
          )}
          {secondaryButtonLabel && secondaryButtonUrl && (
            <Button
              label={secondaryButtonLabel}
              href={secondaryButtonUrl}
              colorScheme="black"
              variant="outline"
              LinkComponent={LinkComponent}
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default Infobar
