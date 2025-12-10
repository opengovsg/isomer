import type { FormSGProps } from "~/interfaces"
import { isValidFormSGEmbedUrl } from "~/utils/validation"
import { BaseParagraph } from "../../internal/BaseParagraph"
import { ComponentContent } from "../../internal/customCssClass"

export const FormSG = ({ title, url, LinkComponent }: FormSGProps) => {
  if (!isValidFormSGEmbedUrl(url)) {
    return <></>
  }

  return (
    <section className={`${ComponentContent} mt-7 first:mt-0`}>
      <BaseParagraph
        content={`If the form below is not loading, <a href="${url}">open it in a new window</a>.`}
        className="prose-body-base pb-2 pt-1 text-base-content"
        LinkComponent={LinkComponent}
      />

      <div className="relative w-full overflow-hidden">
        <iframe
          src={url}
          width="100%"
          style={{
            borderStyle: "none",
            height: 1000,
            overflow: "auto",
          }}
          title={title || "FormSG form embedded in the page"}
        />
      </div>

      <BaseParagraph
        content={`Powered by <a href="https://form.gov.sg">FormSG</a>.`}
        className="prose-body-base pb-2 pt-1 text-base-content"
        LinkComponent={LinkComponent}
      />
    </section>
  )
}
