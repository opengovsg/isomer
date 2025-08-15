import type { FormSGProps } from "~/interfaces"
import { isValidFormSGEmbedUrl } from "~/utils/validation"
import { BaseParagraph } from "../../internal"
import { ComponentContent } from "../../internal/customCssClass"

export const FormSG = ({ title, url, site, LinkComponent }: FormSGProps) => {
  if (!isValidFormSGEmbedUrl(url)) {
    return <></>
  }

  return (
    <section className={`${ComponentContent} mt-7 first:mt-0`}>
      <BaseParagraph
        content={`If the form below is not loaded, you can also fill it in at <a href="${url}">here</a>.`}
        className="prose-body-base pb-2 pt-1 text-base-content opacity-90"
        site={site}
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
        content={`Powered by <a href="https://form.gov.sg">Form</a>.`}
        className="prose-body-base pb-2 pt-1 text-base-content opacity-50"
        site={site}
        LinkComponent={LinkComponent}
      />
    </section>
  )
}
