import type { Preview } from "@storybook/react"

import { ThemeProvider } from "../src/theme/ThemeProvider"

import { INITIAL_VIEWPORTS } from "@storybook/addon-viewport"

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: INITIAL_VIEWPORTS,
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider
        primaryColour="#6031b6"
        secondaryColour="#4372d6"
        secondaryHover="#0094ff"
        mediaColourOne="#49759a"
        mediaColourTwo="#744d9f"
        mediaColourThree="#00838f"
        mediaColourFour="#00838f"
        mediaColourFive="#00838f"
      >
        {/* 👇 Decorators in Storybook also accept a function. Replace <Story/> with Story() to enable it  */}
        <Story />
      </ThemeProvider>
    ),
  ],
}

export default preview
