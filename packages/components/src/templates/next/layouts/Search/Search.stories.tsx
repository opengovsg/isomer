import type { Meta, StoryObj } from "@storybook/react-vite"
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
  categories: [
    {
      value: "Government Gazette",
      displayLabel: "Government Gazette",
      subCategories: [
        { value: "Advertisements", displayLabel: "Advertisements" },
        { value: "Appointments", displayLabel: "Appointments" },
        { value: "Audited Reports", displayLabel: "Audited Reports" },
        {
          value: "Cessation of Service",
          displayLabel: "Cessation of Service",
        },
        { value: "Corrigendum", displayLabel: "Corrigendum" },
        { value: "Death", displayLabel: "Death" },
        { value: "Dismissals", displayLabel: "Dismissals" },
        { value: "Leave", displayLabel: "Leave" },
        {
          value: "Bankruptcy Act Notice",
          displayLabel: "Notices (Bankruptcy Act)",
        },
        {
          value: "Companies Act Notice",
          displayLabel: "Notices (Companies Act)",
        },
        {
          value: "Notices under the Constitution",
          displayLabel: "Notices (Constitution)",
        },
        {
          value: "Notices under other Acts",
          displayLabel: "Notices (other Acts)",
        },
        { value: "Revocation", displayLabel: "Revocation" },
        { value: "Tenders", displayLabel: "Tenders" },
        {
          value: "Termination of Service",
          displayLabel: "Termination of Service",
        },
        { value: "Vacation of Service", displayLabel: "Vacation of Service" },
        { value: "Others", displayLabel: "Others" },
      ],
    },
    {
      value: "Legislative Supplements",
      displayLabel: "Legislation Supplements",
      subCategories: [
        { value: "Bills Supplement", displayLabel: "Bills Supplement" },
        { value: "Acts Supplement", displayLabel: "Acts Supplement" },
        {
          value: "Subsidiary Legislation Supplement",
          displayLabel: "Subsidiary Legislation Supplement",
        },
        { value: "Revised Acts", displayLabel: "Revised Acts" },
        {
          value: "Revised Subsidiary Legislation",
          displayLabel: "Revised Subsidiary Legislation",
        },
      ],
    },
    {
      value: "Other Supplements",
      displayLabel: "Other Supplements",
      subCategories: [
        {
          value: "Government Gazette Supplement",
          displayLabel: "Government Gazette Supplement",
        },
        {
          value: "Industrial Relations Supplement",
          displayLabel: "Industrial Relations Supplement",
        },
        {
          value: "Trade Marks Supplement",
          displayLabel: "Trade Marks Supplement",
        },
        { value: "Treaties Supplement", displayLabel: "Treaties Supplement" },
      ],
    },
  ],
}

export const EgazetteAlgolia: Story = {
  args: {
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
  },
}
