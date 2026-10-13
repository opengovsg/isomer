/** Theme identity is separate from the site's editable brand palette. */
export const ISOMER_THEMES = {
  "isomer-next": {
    label: "Isomer Next",
    publishable: true,
    fontStylesheet: undefined,
  },
  "isomer-classic": {
    label: "Isomer Classic",
    publishable: false,
    fontStylesheet:
      "https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;0,900;1,400&display=swap",
  },
} as const

export type IsomerTheme = keyof typeof ISOMER_THEMES

export const DEFAULT_THEME: IsomerTheme = "isomer-next"

export function getTheme(id: unknown = DEFAULT_THEME): IsomerTheme {
  if (typeof id !== "string" || !Object.keys(ISOMER_THEMES).includes(id)) {
    throw new Error(`Unknown Isomer theme: ${String(id)}`)
  }
  return id as IsomerTheme
}

export function getPublishableTheme(id: unknown = DEFAULT_THEME): IsomerTheme {
  const theme = getTheme(id)
  if (!ISOMER_THEMES[theme].publishable) {
    throw new Error(
      `${ISOMER_THEMES[theme].label} is a development reference and cannot be published`,
    )
  }
  return theme
}
