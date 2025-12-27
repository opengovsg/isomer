import type { IsomerPageSchemaType } from "~/types"

export const shouldBlockIndexing = (
  environment: IsomerPageSchemaType["site"]["environment"],
): boolean => {
  return environment !== "production"
}
