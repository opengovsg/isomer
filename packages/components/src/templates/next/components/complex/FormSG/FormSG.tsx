import type { FormSGProps } from "~/interfaces"
import { twMerge } from "~/lib/twMerge"
import { isValidFormSGEmbedUrl } from "~/utils/validation"

import { BaseParagraph } from "../../internal/BaseParagraph"
import { ComponentContent } from "../../internal/customCssClass"

export const FormSG = ({ title, url, shouldLazyLoad = true }: FormSGProps) => {
  if (!isValidFormSGEmbedUrl(url)) {
    return <></>
  }

  return (
    <section className={twMerge(ComponentContent, "mt-7 first:mt-0")}>
      <BaseParagraph
        content={`If the form below doesn't load, <a href="${url}" target="_blank">open it in a new window</a>.`}
        className="prose-body-base text-base-content pt-1 pb-2 opacity-90"
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
          loading={shouldLazyLoad ? "lazy" : "eager"}
        />
      </div>

      <BaseParagraph
        content={`Powered by <a href="https://form.gov.sg">Form</a>.`}
        className="prose-body-base text-base-content-subtle pt-1 pb-2"
      />
    </section>
  )
}
