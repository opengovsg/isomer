import type { FormSGProps } from "~/interfaces"
import { isValidFormSGEmbedUrl } from "~/utils/validation"
import { ComponentContent } from "../../internal/customCssClass"

export const FormSG = ({ title, url }: FormSGProps) => {
  if (!isValidFormSGEmbedUrl(url)) {
    return <></>
  }

  return (
    <section className={`${ComponentContent} mt-7 first:mt-0`}>
      <div className="pb-2 pt-1 opacity-90">
        If the form below is not loaded, you can also fill it in at
        <a href={url}>here</a>.
      </div>

      <div className="relative w-full overflow-hidden">
        <iframe
          src={url}
          height="100%"
          width="100%"
          title={title || "FormSG form embedded in the page"}
        />
      </div>

      <div className="opacity-50">
        Powered by{" "}
        <a href="https://form.gov.sg" className="pt-1 text-[#999]">
          Form
        </a>
      </div>
    </section>
  )
}
