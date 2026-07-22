import type { Decorator, Meta, StoryObj } from "@storybook/react-vite"
import { useEffect } from "react"
import { expect, userEvent, waitFor, within } from "storybook/test"
import {
  SEARCHSG_TEST_CLIENT_ID,
  withSearchSgSetup,
} from "~/stories/decorators"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { SearchLayout } from "./Search"

const meta: Meta<typeof SearchLayout> = {
  title: "Next/Layouts/Search",
  component: SearchLayout,
  decorators: [withSearchSgSetup({ pageType: "search" })],
  argTypes: {},
  tags: ["!autodocs"],
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}

export default meta
type Story = StoryObj<typeof SearchLayout>

export const SearchSG: Story = {
  name: "SearchSG",
  args: {
    layout: "search",
    site: generateSiteConfig({
      search: {
        type: "searchSG",
        clientId: SEARCHSG_TEST_CLIENT_ID,
      },
    }),
    meta: {
      description: "Search results",
    },
    page: {
      title: "Search",
      permalink: "/search",
      lastModified: "2024-05-02T14:12:57.160Z",
    },
  },
}

// Staging Algolia credentials reused from the legacy Jekyll egazette template — safe to commit
// because these are public search-only keys that ship in the browser bundle today.
const EGAZETTE_STAGING_CONFIG = {
  type: "egazette-algolia" as const,
  appId: "1V7DZGZJKK",
  searchApiKey: "bbc5751b3f9b7fdfc08c99712adfa397",
  indexName: "staging_ogp_egazettes_index",
}

const EGAZETTE_ARGS: Story["args"] = {
  layout: "search",
  site: generateSiteConfig({
    siteName: "Singapore Government e-Gazette",
    search: EGAZETTE_STAGING_CONFIG,
  }),
  meta: {
    description: "Search the Singapore Government e-Gazette",
  },
  page: {
    title: "Search the e-Gazette",
    permalink: "/search",
    lastModified: "2026-01-15T00:00:00.000Z",
  },
}

export const EgazetteAlgolia: Story = {
  args: EGAZETTE_ARGS,
}

// The stories below hit the live staging Algolia index, so hit counts and
// results vary between runs — skip Chromatic snapshots to avoid flakiness.
const liveAlgoliaParameters = {
  chromatic: { disableSnapshot: true },
}

export const EgazetteAlgoliaWithCategorySelected: Story = {
  args: EGAZETTE_ARGS,
  parameters: liveAlgoliaParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("checkbox", { name: /^Government Gazette/ }),
    )
    // Sub-category section appears only once a category is selected, in the
    // order declared by the taxonomy, with zero-count rows dimmed + disabled.
    await expect(
      await canvas.findByRole("checkbox", { name: /^Advertisements/ }),
    ).toBeInTheDocument()
  },
}

export const EgazetteAlgoliaWithYearRange: Story = {
  args: EGAZETTE_ARGS,
  parameters: liveAlgoliaParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Range inputs stay disabled until the first Algolia response arrives.
    const yearFromInput = canvas.getAllByLabelText("From")[0]
    if (!yearFromInput) throw new Error("Year range input not found")
    await waitFor(() => expect(yearFromInput).toBeEnabled(), { timeout: 10000 })
    await userEvent.type(yearFromInput, "2024")
    const goButton = canvas.getAllByRole("button", { name: "Go" })[0]
    if (!goButton) throw new Error("Year range submit button not found")
    await userEvent.click(goButton)
  },
}

// A year beyond the index's derived range must be rejected with an inline error
// instead of applying a filter that matches nothing. 3000 is safely past any
// gazette's publish year, so it always exceeds the index's max.
export const EgazetteAlgoliaYearOutOfRange: Story = {
  args: EGAZETTE_ARGS,
  parameters: liveAlgoliaParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The year "To" field is the first "To" input (year precedes month).
    const yearToInput = canvas.getAllByLabelText("To")[0]
    if (!yearToInput) throw new Error("Year range input not found")
    await waitFor(() => expect(yearToInput).toBeEnabled(), { timeout: 10000 })
    await userEvent.type(yearToInput, "3000")
    const goButton = canvas.getAllByRole("button", { name: "Go" })[0]
    if (!goButton) throw new Error("Year range submit button not found")
    await userEvent.click(goButton)
    await expect(await canvas.findByText(/or earlier/i)).toBeInTheDocument()
  },
}

// Seeds the URL with egazette deep-link params before <InstantSearch> mounts,
// then restores the original URL on unmount so other stories are unaffected.
const withDeepLinkParams = (search: string): Decorator => {
  return (StoryComponent) => {
    const original = `${window.location.pathname}${window.location.search}`
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search}`,
    )
    // oxlint-disable-next-line rules-of-hooks -- decorators render as components
    useEffect(() => {
      return () => window.history.replaceState(null, "", original)
    }, [original])
    return <StoryComponent />
  }
}

export const EgazetteAlgoliaNoResults: Story = {
  args: EGAZETTE_ARGS,
  parameters: liveAlgoliaParameters,
  decorators: [withDeepLinkParams("?q=zzzzquerywithnoresultszzzz")],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(
      () =>
        expect(
          canvas.getByText("We couldn’t find any results."),
        ).toBeInTheDocument(),
      { timeout: 10000 },
    )
    await expect(
      canvas.getByText("Try different search terms or filters."),
    ).toBeInTheDocument()
  },
}

export const EgazetteAlgoliaWithDeepLink: Story = {
  args: EGAZETTE_ARGS,
  parameters: liveAlgoliaParameters,
  decorators: [
    withDeepLinkParams("?q=tender&category=Government%20Gazette&minYear=2024"),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // URL params hydrate the initial UI state on mount.
    await expect(canvas.getByRole("searchbox")).toHaveValue("tender")
    // isRefined on the checkbox only reflects once the first Algolia response lands
    await waitFor(
      () =>
        expect(
          canvas.getByRole("checkbox", { name: /^Government Gazette/ }),
        ).toBeChecked(),
      { timeout: 10000 },
    )
    await expect(
      await canvas.findByRole("checkbox", { name: /^Advertisements/ }),
    ).toBeInTheDocument()
  },
}
