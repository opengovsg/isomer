import type { ProvidedContainers } from "@opengovsg/starter-kitty-testcontainers/vitest"

declare module "vitest" {
  export interface ProvidedContext {
    testcontainers: ProvidedContainers
  }
}
