// Replace your-framework with the framework you are using (e.g., react, vue3)
import type { Preview } from "@storybook/react"
import {
  withThemeByClassName,
  withThemeByDataAttribute,
} from "@storybook/addon-themes"
import { MINIMAL_VIEWPORTS } from "@storybook/addon-viewport"

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
  parameters: {
    viewport: {
      viewports: {
        ...viewport.viewports,
        ...MINIMAL_VIEWPORTS,
        ...CUSTOM_GENERAL_VIEWPORTS,
        ...CUSTOM_GSIB_VIEWPORTS,
      },
    },
  },
}

export const decorators: any = [
  withThemeByDataAttribute({
    themes: {
      "Isomer Classic": "isomer-classic",
      "Isomer Next": "isomer-next",
    },
    defaultTheme: "Isomer Next",
  }),
]

export default preview
