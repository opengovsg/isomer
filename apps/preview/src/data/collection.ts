import type { CollectionPageSchemaType } from "@opengovsg/isomer-components"

import { makeSite } from "./site"

const ITEMS = [
  {
    id: "c1",
    title: "Singapore's Digital Economy Framework 2030",
    permalink: "/newsroom/sg-digital-economy-2030",
    lastModified: "",
    layout: "article" as const,
    summary:
      "The framework outlines Singapore's strategy to build a world-class digital economy by 2030, focusing on enterprise transformation, digital infrastructure, and a future-ready workforce.",
    date: "2024-07-15",
    category: "Policy",
  },
  {
    id: "c2",
    title: "Enterprise Development Grant: 2024 Annual Report",
    permalink: "/newsroom/edg-annual-report-2024",
    lastModified: "",
    layout: "file" as const,
    summary:
      "A comprehensive review of EDG outcomes in FY2024, including sector breakdown, grant quantum statistics, and case studies from supported enterprises.",
    date: "2024-06-01",
    category: "Reports",
    ref: "https://www.enterprisesg.gov.sg",
    fileDetails: { type: "pdf" as const, size: "3.4 MB" },
    image: {
      src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop",
      alt: "Financial report documents",
    },
  },
  {
    id: "c3",
    title: "Smart Industry Readiness Index 2024",
    permalink: "/newsroom/siri-2024",
    lastModified: "",
    layout: "article" as const,
    summary:
      "The annual SIRI assessment benchmarks Singapore manufacturers on their Industry 4.0 transformation journey across eight technology pillars.",
    date: "2024-05-20",
    category: "Reports",
  },
  {
    id: "c4",
    title: "Market Readiness Assistance Grant: Expanded Markets",
    permalink: "/newsroom/mra-expanded-markets",
    lastModified: "",
    layout: "article" as const,
    summary:
      "MRA grant coverage now extends to 13 new markets across Africa and South Asia, broadening support for Singapore SMEs entering high-growth regions.",
    date: "2024-04-10",
    category: "Announcements",
  },
  {
    id: "c5",
    title: "Guide to Applying for Business Grants in Singapore",
    permalink: "/newsroom/business-grants-guide",
    lastModified: "",
    layout: "link" as const,
    summary:
      "A practical guide for SME owners on navigating the Business Grants Portal and selecting the right grant for their growth stage.",
    date: "2024-03-05",
    category: "Guides",
    ref: "https://www.businessgrants.gov.sg",
  },
  {
    id: "c6",
    title: "Minister's Speech at Enterprise Singapore Annual Summit",
    permalink: "/newsroom/minister-speech-esg-summit-2024",
    lastModified: "",
    layout: "article" as const,
    summary:
      "Minister for Trade and Industry delivered a keynote on Singapore's enterprise development priorities, highlighting the pivot to global value chain integration.",
    date: "2024-02-28",
    category: "Speeches",
  },
  {
    id: "c7",
    title: "Factsheet: Productivity Solutions Grant Updates 2024",
    permalink: "/newsroom/psg-updates-2024",
    lastModified: "",
    layout: "file" as const,
    summary:
      "Updated list of pre-approved PSG solutions for FY2024, including new categories for cybersecurity and sustainability management software.",
    date: "2024-01-15",
    category: "Announcements",
    ref: "https://www.enterprisesg.gov.sg",
    fileDetails: { type: "pdf" as const, size: "890 KB" },
  },
  {
    id: "c8",
    title: "Singapore Business Index Q4 2023",
    permalink: "/newsroom/sg-business-index-q4-2023",
    lastModified: "",
    layout: "article" as const,
    summary:
      "The quarterly Business Index tracks sentiment across manufacturing, services, and trade sectors. Q4 2023 showed resilient growth amid global headwinds.",
    date: "2023-12-20",
    category: "Reports",
  },
]

export const collectionData: CollectionPageSchemaType = {
  layout: "collection",
  site: makeSite({
    siteName: "Isomer Next",
    siteMap: {
      id: "1",
      title: "Home",
      permalink: "/",
      lastModified: "",
      layout: "homepage",
      summary: "",
      children: [
        {
          id: "2",
          title: "Newsroom",
          permalink: "/newsroom",
          lastModified: "",
          layout: "collection",
          summary: "",
          children: ITEMS,
        },
      ],
    },
    navbar: {
      items: [
        { name: "Home", url: "/" },
        { name: "Newsroom", url: "/newsroom" },
        { name: "Schemes & grants", url: "/schemes" },
        { name: "About us", url: "/about" },
      ],
    },
  }),
  page: {
    title: "Newsroom",
    permalink: "/newsroom",
    lastModified: "2024-07-15T00:00:00.000Z",
    subtitle:
      "The latest announcements, reports, speeches, and guides from Enterprise Singapore.",
    variant: "collection",
  },
  content: [],
}
