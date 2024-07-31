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
      <div className={`${ComponentContent} mx-6 py-16 sm:mx-10 lg:py-24`}>
        <div className="mx-auto flex flex-col items-center gap-9 text-center lg:max-w-3xl">
          <div className="flex flex-col gap-6">
            <h1 className="prose-display-lg text-base-content-strong">
              {title}
            </h1>
            {description && (
              <p className="prose-headline-lg-regular text-base-content">
                {description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-center gap-x-5 gap-y-4 sm:flex-row">
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
      </div>
    </section>
  )
}

export default Infobar
