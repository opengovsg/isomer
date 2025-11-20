import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"

export const shouldBlockIndexing = (
  environment: IsomerPageSchemaType["site"]["environment"],
): boolean => {
  return environment !== "production"
}
