declare module "*.css"
declare module "*.scss"
declare module "@fontsource/ibm-plex-mono"

// jsdom does not ship its own TypeScript declarations.
// This minimal stub covers the subset used in asset.service.ts.
declare module "jsdom" {
  export class JSDOM {
    constructor(html: string, options?: Record<string, unknown>)
    readonly window: Window & typeof globalThis
  }
}
