import type { ProvidedContainers } from "@opengovsg/testcontainers/vitest"

declare module "vitest" {
  export interface ProvidedContext {
    testcontainers: ProvidedContainers
  }
}
