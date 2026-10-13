import type { defaultComponents } from "../engine/renderComponent"
import type { defaultLayouts } from "../engine/renderLayout"
import type { defaultShell } from "../templates/next/layouts/Skeleton/Skeleton"
import { ClassicInfopic } from "../templates/classic/components/Infopic"
import { getTheme, type IsomerTheme } from "./index"

/** Overrides retain the default implementation's complete prop contract. */
interface ThemeOverrides {
  components?: Partial<typeof defaultComponents>
  layouts?: Partial<typeof defaultLayouts>
  shell?: Partial<typeof defaultShell>
}

const overrides: Record<IsomerTheme, ThemeOverrides> = {
  "isomer-next": {},
  "isomer-classic": { components: { Infopic: ClassicInfopic } },
}

export const getThemeOverrides = (theme: IsomerTheme) =>
  overrides[getTheme(theme)]
