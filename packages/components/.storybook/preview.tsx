// Replace your-framework with the framework you are using (e.g., react, vue3)
import type { Decorator, Preview } from "@storybook/react-vite"
import { withThemeByDataAttribute } from "@storybook/addon-themes"
import mockdate from "mockdate"
import { mswLoader } from "msw-storybook-addon/csf3"
import { setupWorker } from "msw/browser"
import { MINIMAL_VIEWPORTS } from "storybook/viewport"
import "bootstrap-icons/font/bootstrap-icons.css"

import "../src/index.css"
import { viewport } from "@isomer/storybook-config"

const CUSTOM_GENERAL_VIEWPORTS = {
  smallDesktop: {
    name: "Small Desktop",
    styles: {
      width: "1280px",
      height: "720px",
    },
  },
  mediumDesktop: {
    name: "Medium Desktop",
    styles: {
      width: "1366px",
      height: "768px",
    },
  },
  largeDesktop: {
    name: "Large Desktop",
    styles: {
      width: "1920px",
      height: "1080px",
    },
  },
  iphone14: {
    name: "iPhone 12/13/14",
    styles: {
      width: "390px",
      height: "844px",
    },
  },
  iphone15ProMax: {
    name: "iPhone 14/15 Pro Max",
    styles: {
      width: "430px",
      height: "932px",
    },
  },
}

const CUSTOM_GSIB_VIEWPORTS = {
  gsibEdgeFav: {
    name: "GSIB Edge with Favorites Bar",
    styles: {
      width: "1272px",
      height: "652px",
    },
  },
  gsibEdge: {
    name: "GSIB Edge without Favorites Bar",
    styles: {
      width: "1272px",
      height: "686px",
    },
  },
  gsibChromeBookmarks: {
    name: "GSIB Chrome with Bookmarks Bar",
    styles: {
      width: "1280px",
      height: "651.33px",
    },
  },
  gsibChrome: {
    name: "GSIB Chrome without Bookmarks Bar",
    styles: {
      width: "1280px",
      height: "683.33px",
    },
  },
}

const preview: Preview = {
  loaders: [
    mswLoader(async () => {
      const worker = setupWorker()
      await worker.start({ onUnhandledRequest: "bypass" })
      return worker
    }),
  ],

  parameters: {
    viewport: {
      options: {
        ...viewport.viewports,
        ...MINIMAL_VIEWPORTS,
        ...CUSTOM_GENERAL_VIEWPORTS,
        ...CUSTOM_GSIB_VIEWPORTS,
      },
    },
    /**
     * If tablet view is needed, add it on a per-story basis.
     * @example
     * ```
     * export const SomeStory: Story = {
     *   parameters: {
     *     chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
     *   }
     * }
     * ```
     */
    chromatic: {
      prefersReducedMotion: "reduce",
    },
  },

  tags: ["autodocs"],
}

const LayoutDecorator: Decorator = (Story) => (
  <div className="antialiased">
    <Story />
  </div>
)

const MockDateDecorator: Decorator = (Story) => {
  mockdate.reset()
  const defaultDate = "2025-08-09T12:00:00.000Z"
  mockdate.set(defaultDate)

  return <Story />
}

const ISOMER_QUERY_PARAM_KEYS = ["filters", "page", "search"] as const

// Storybook's preview iframe is a single persistent document, so query state
// written by a previous story can leak into the next one. Remove only the
// Isomer query params: Storybook also uses the search string for its story ID
// and render mode, and clearing those parameters makes Chromatic unable to
// render the story.
const ResetQueryParamsDecorator: Decorator = (Story) => {
  const url = new URL(window.location.href)
  const previousSearch = url.search

  ISOMER_QUERY_PARAM_KEYS.forEach((key) => url.searchParams.delete(key))

  if (url.search !== previousSearch) {
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    )
  }

  return <Story />
}

export const decorators: Decorator[] = [
  withThemeByDataAttribute({
    themes: {
      "Isomer Next": "isomer-next",
    },
    defaultTheme: "Isomer Next",
  }),
  LayoutDecorator,
  MockDateDecorator,
  ResetQueryParamsDecorator,
]

export default preview
