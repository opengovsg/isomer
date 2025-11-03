import type { CloudflareZarazProps } from "~/interfaces/internal"

// Reference: https://developers.cloudflare.com/zaraz/advanced/domains-not-proxied/
export const CloudflareZaraz = ({
  hostname,
  ScriptComponent,
}: CloudflareZarazProps) => {
  return <ScriptComponent src={`${hostname}/cdn-cgi/zaraz/i.js`} />
}
