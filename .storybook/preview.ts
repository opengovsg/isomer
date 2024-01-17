// Replace your-framework with the framework you are using (e.g., react, vue3)
import { Preview } from "@storybook/react"
import {
  withThemeByClassName,
  withThemeByDataAttribute,
} from "@storybook/addon-themes"

import "../src/index.css"

const preview: Preview = {
  parameters: {},
}

export const decorators: any = [
  withThemeByClassName({
    themes: {
      light: "light",
      dark: "dark",
    },
    defaultTheme: "light",
  }),
  withThemeByDataAttribute({
    themes: {
      light: "light",
      dark: "dark",
    },
    defaultTheme: "light",
    attributeName: "data-mode",
  }),
]

export default preview
