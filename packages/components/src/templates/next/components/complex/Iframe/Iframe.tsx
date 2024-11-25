import type { IframeProps } from "~/interfaces"
import { getSanitizedIframeWithTitle } from "~/utils"
import { ComponentContent } from "../../internal/customCssClass"

// Sets the appropriate padding for the iframe based on the URL
// 56.25% is a 16:9 aspect ratio (16/9 * 100 = 56.25)
// 75% is a 4:3 aspect ratio (4/3 * 100 = 75)
// FormSG embeds require a fixed height of 600px
const getPaddingForEmbed = (url: string | null) => {
  if (!url) {
    return "pt-[100%]"
  }

  if (url.startsWith("https://form.gov.sg")) {
    return "pt-[600px]"
  }

  if (
    url.startsWith("https://calendar.google.com") ||
    url.startsWith("https://www.google.com/maps/")
  ) {
    return "pt-[75%]"
  }

  return "pt-[56.25%]"
}

/**
 * @deprecated Replaced with individual website embed components
 */
const Iframe = ({ title, content }: IframeProps) => {
  const sanitizedIframe = getSanitizedIframeWithTitle(content, title)
  const iframeUrl = sanitizedIframe.getAttribute("src")

  return (
    <section className={`mt-7 first:mt-0 ${ComponentContent}`}>
      <div
        className={`relative w-full overflow-hidden ${getPaddingForEmbed(
          iframeUrl,
        )}`}
        dangerouslySetInnerHTML={{ __html: sanitizedIframe.outerHTML }}
      />
    </section>
  )
}

export default Iframe
