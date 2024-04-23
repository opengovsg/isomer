import type { IframeProps } from "~/common"
import { getSanitizedIframeWithTitle } from "~/utils/getSanitizedIframeEmbed"

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

const Iframe = ({ title, content }: IframeProps) => {
  const sanitizedIframe = getSanitizedIframeWithTitle(content, title)
  const iframeUrl = sanitizedIframe.getAttribute("src")

  return (
    <div
      className={`relative overflow-hidden w-full ${getPaddingForEmbed(
        iframeUrl,
      )}`}
      dangerouslySetInnerHTML={{ __html: sanitizedIframe.outerHTML }}
    />
  )
}

export default Iframe
