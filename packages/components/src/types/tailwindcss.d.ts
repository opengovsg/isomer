// Ambient module declarations for tailwindcss v4 subpath imports.
// Tailwind v4 ships types only via package.json `exports` conditions (.d.mts),
// which moduleResolution:"node" cannot resolve. The base tsconfig uses
// moduleResolution:"bundler" (real types); the CJS build uses moduleResolution:"node"
// and falls back to these declarations.

declare module "tailwindcss" {
  type ThemeValue =
    | Record<string, unknown>
    | ((utils: { theme: (path: string) => unknown }) => Record<string, unknown>)
    | null
    | undefined

  interface ThemeConfig {
    extend?: ThemeConfig
    [key: string]: ThemeValue | ThemeConfig
  }

  export interface Config {
    content?:
      | (string | { raw: string; extension?: string })[]
      | {
          relative?: boolean
          files: (string | { raw: string; extension?: string })[]
        }
    theme?: ThemeConfig
    plugins?: unknown[]
    presets?: Config[]
    prefix?: string
    darkMode?:
      | false
      | "media"
      | "class"
      | ["class", string]
      | "selector"
      | ["selector", string]
      | ["variant", string | string[]]
    blocklist?: string[]
    important?: boolean | string
    future?: "all" | Record<string, boolean>
    experimental?: "all" | Record<string, boolean>
  }
}

declare module "tailwindcss/colors" {
  interface Shades {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
    950: string
    [key: string]: string
  }

  interface Colors {
    inherit: string
    current: string
    transparent: string
    black: string
    white: string
    slate: Shades
    gray: Shades
    zinc: Shades
    neutral: Shades
    stone: Shades
    red: Shades
    orange: Shades
    amber: Shades
    yellow: Shades
    lime: Shades
    green: Shades
    emerald: Shades
    teal: Shades
    cyan: Shades
    sky: Shades
    blue: Shades
    indigo: Shades
    violet: Shades
    purple: Shades
    fuchsia: Shades
    pink: Shades
    rose: Shades
    [key: string]: string | Shades
  }

  const colors: Colors
  export default colors
}

declare module "tailwindcss/defaultTheme" {
  interface DefaultTheme {
    screens: Record<string, string>
    fontFamily: {
      sans: string[]
      serif: string[]
      mono: string[]
      [key: string]: string[]
    }
    spacing: Record<string, string>
    colors: Record<string, unknown>
    [key: string]: unknown
  }

  const defaultTheme: DefaultTheme
  export default defaultTheme
}

declare module "tailwindcss/plugin" {
  interface CssInJs {
    [key: string]: string | string[] | CssInJs | CssInJs[]
  }

  interface PluginAPI {
    addBase(base: CssInJs): void
    addUtilities(
      utilities:
        | Record<string, CssInJs | CssInJs[]>
        | Record<string, CssInJs | CssInJs[]>[],
      options?: object,
    ): void
    addComponents(
      utilities: Record<string, CssInJs> | Record<string, CssInJs>[],
      options?: object,
    ): void
    matchUtilities(
      utilities: Record<
        string,
        (
          value: string,
          extra: { modifier: string | null },
        ) => CssInJs | CssInJs[]
      >,
      options?: {
        type?: string | string[]
        supportsNegativeValues?: boolean
        values?: Record<string, string>
        modifiers?: "any" | Record<string, string>
      },
    ): void
    matchComponents(
      utilities: Record<
        string,
        (value: string, extra: { modifier: string | null }) => CssInJs
      >,
      options?: {
        type?: string | string[]
        values?: Record<string, string>
      },
    ): void
    addVariant(name: string, variant: string | string[] | CssInJs): void
    matchVariant<T = string>(
      name: string,
      cb: (
        value: T | string,
        extra: { modifier: string | null },
      ) => string | string[],
      options?: { values?: Record<string, T> },
    ): void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    theme(path: string, defaultValue?: any): any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config(path?: string, defaultValue?: any): any
    prefix(className: string): string
  }

  type PluginFn = (api: PluginAPI) => void

  export interface PluginWithConfig {
    handler: PluginFn
    config?: object
    reference?: boolean
  }

  interface PluginWithOptions<T> {
    (options?: T): PluginWithConfig
    __isOptionsFunction: true
  }

  interface PluginCreator {
    (handler: PluginFn, config?: Partial<object>): PluginWithConfig
    withOptions<T>(
      pluginFunction: (options?: T) => PluginFn,
      configFunction?: (options?: T) => object,
    ): PluginWithOptions<T>
  }

  const plugin: PluginCreator
  export default plugin
}
