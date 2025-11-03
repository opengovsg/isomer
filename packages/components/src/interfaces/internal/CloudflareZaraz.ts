import type { IsomerSiteProps, ScriptComponentType } from "~/types"

export interface CloudflareZarazProps {
  baseUrl: NonNullable<IsomerSiteProps["isomerCfZarazBaseUrl"]>
  ScriptComponent?: ScriptComponentType
}
