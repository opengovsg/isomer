// Serialises the live preview iframe into a standalone, downloadable HTML file.
// External links are kept; internal (relative / same-site) links become no-ops.

const PREVIEW_CSS_URL = "/assets/css/preview-tw.css"

// Keep in-page anchors and links to other hosts; drop internal navigations.
export function shouldKeepHref(href: string, siteHost: string): boolean {
  if (href.startsWith("#")) return true
  if (!/^https?:\/\//i.test(href)) return false // relative → internal
  try {
    return new URL(href).host !== siteHost
  } catch {
    return false
  }
}

export async function buildStandaloneHtml(
  iframeDoc: Document,
  siteHost: string,
): Promise<string> {
  const root = iframeDoc.documentElement.cloneNode(true) as HTMLElement

  // Inline the prebuilt Tailwind so the file carries its own styling.
  const css = await fetch(PREVIEW_CSS_URL).then((r) => r.text())
  root.querySelector(`link[href*="preview-tw.css"]`)?.remove()
  const style = iframeDoc.createElement("style")
  style.textContent = css
  ;(root.querySelector("head") ?? root).appendChild(style)

  // Static content: no hydration needed.
  root.querySelectorAll("script").forEach((s) => s.remove())

  root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
    if (!shouldKeepHref(a.getAttribute("href") ?? "", siteHost)) {
      a.removeAttribute("href")
    }
  })

  return `<!DOCTYPE html>\n${root.outerHTML}`
}

export function downloadHtml(html: string, fileName: string): void {
  const blob = new Blob([html], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName.endsWith(".html") ? fileName : `${fileName}.html`
  a.click()
  URL.revokeObjectURL(url)
}
