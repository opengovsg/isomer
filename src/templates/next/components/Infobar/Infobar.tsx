import { InfobarProps } from "~/common"
import Button from "../Button"
import { ComponentContent } from "../shared/customCssClass"

const Infobar = ({
  sectionIdx,
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
        className={`${ComponentContent} flex flex-col gap-12 items-center mx-auto text-center lg:max-w-3xl px-5 py-16 lg:py-24`}
      >
        <div className="flex flex-col gap-7">
          <h1 className="text-content text-4xl leading-tight font-semibold lg:text-5xl lg:leading-tight">
            {title}
          </h1>
          {description && <p className="text-content text-xl">{description}</p>}
        </div>
        <div className="flex flex-col gap-6 items-center sm:flex-row">
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
