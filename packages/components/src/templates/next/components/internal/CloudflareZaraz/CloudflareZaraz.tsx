import type { CloudflareZarazProps } from "~/interfaces/internal"

// Reference: https://developers.cloudflare.com/zaraz/advanced/domains-not-proxied/
export const CloudflareZaraz = ({
  baseUrl,
  ScriptComponent,
}: CloudflareZarazProps) => {
  return <ScriptComponent src={`${baseUrl}/cdn-cgi/zaraz/i.js`} />
}
