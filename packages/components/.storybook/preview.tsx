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
  iphone14: {
    name: "iPhone 12/13/14",
    styles: {
      height: "844px",
      width: "390px",
    },
  },
  iphone15ProMax: {
    name: "iPhone 14/15 Pro Max",
    styles: {
      height: "932px",
      width: "430px",
    },
  },
  largeDesktop: {
    name: "Large Desktop",
    styles: {
      height: "1080px",
      width: "1920px",
    },
  },
  mediumDesktop: {
    name: "Medium Desktop",
    styles: {
      height: "768px",
      width: "1366px",
    },
  },
  smallDesktop: {
    name: "Small Desktop",
    styles: {
      height: "720px",
      width: "1280px",
    },
  },
}

const CUSTOM_GSIB_VIEWPORTS = {
  gsibChrome: {
    name: "GSIB Chrome without Bookmarks Bar",
    styles: {
      height: "683.33px",
      width: "1280px",
    },
  },
  gsibChromeBookmarks: {
    name: "GSIB Chrome with Bookmarks Bar",
    styles: {
      height: "651.33px",
      width: "1280px",
    },
  },
  gsibEdge: {
    name: "GSIB Edge without Favorites Bar",
    styles: {
      height: "686px",
      width: "1272px",
    },
  },
  gsibEdgeFav: {
    name: "GSIB Edge with Favorites Bar",
    styles: {
      height: "652px",
      width: "1272px",
    },
  },
}

const ISOMER_QUERY_PARAM_KEYS = ["filters", "page", "search"] as const

const resetIsomerQueryParams = () => {
  const url = new URL(window.location.href)
  const previousSearch = url.search

  for (const key of ISOMER_QUERY_PARAM_KEYS) {
    url.searchParams.delete(key)
  }

  if (url.search !== previousSearch) {
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    )
  }
}

const preview: Preview = {
  // Storybook's preview iframe is a single persistent document, so query
  // state written by a previous story can leak into the next one. Reset only
  // Isomer's parameters before rendering; Storybook owns the other parameters
  // in the search string. A lifecycle hook keeps this side effect out of
  // React's render phase, which is required by Chromatic's story renderer.
  beforeEach: resetIsomerQueryParams,

  loaders: [
    mswLoader(async () => {
      const worker = setupWorker()
      await worker.start({ onUnhandledRequest: "bypass" })
      return worker
    }),
  ],

  parameters: {
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
    viewport: {
      options: {
        ...viewport.viewports,
        ...MINIMAL_VIEWPORTS,
        ...CUSTOM_GENERAL_VIEWPORTS,
        ...CUSTOM_GSIB_VIEWPORTS,
      },
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

export const decorators: Decorator[] = [
  withThemeByDataAttribute({
    defaultTheme: "Isomer Next",
    themes: {
      "Isomer Next": "isomer-next",
    },
  }),
  LayoutDecorator,
  MockDateDecorator,
]

export default preview
