import type { HomePageSchemaType } from "@opengovsg/isomer-components"

import { makeSite } from "./site"

export type SitePresetKey =
  | "corporate"
  | "campaign"
  | "formal"
  | "modern"
  | "school"

function makeHomeNavbar(items: { name: string; url: string }[]) {
  return { items }
}

export const SITE_HOME_DATA: Record<SitePresetKey, HomePageSchemaType> = {
  corporate: {
    layout: "homepage",
    site: makeSite({
      siteName: "Ministry of Trade and Industry",
      navbar: makeHomeNavbar([
        { name: "About us", url: "/about" },
        { name: "Industries", url: "/industries" },
        { name: "Media", url: "/media" },
        { name: "Contact us", url: "/contact" },
      ]),
    }),
    meta: { description: "Ministry of Trade and Industry Singapore" },
    page: { permalink: "/", lastModified: "", title: "Home" },
    content: [
      {
        type: "hero",
        variant: "gradient",
        backgroundUrl:
          "https://images.unsplash.com/photo-1565967511849-76a60a516170?q=80&w=2071&auto=format&fit=crop",
        title: "Ministry of Trade and Industry",
        subtitle:
          "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
        buttonLabel: "Explore services",
        buttonUrl: "/",
        secondaryButtonLabel: "Learn more",
        secondaryButtonUrl: "/about",
      },
      {
        type: "infobar",
        variant: "light",
        title: "Supporting Singapore's economic growth",
        description:
          "We work with industry partners to create jobs, attract investments, and develop a vibrant economy for all Singaporeans.",
        buttonLabel: "Our work",
        buttonUrl: "/",
        secondaryButtonLabel: "Latest news",
        secondaryButtonUrl: "/news",
      },
      {
        type: "infopic",
        title: "Growing our industries together",
        description:
          "We champion enterprise development, promote international trade, and partner businesses to innovate and grow.",
        imageAlt: "Singapore skyline",
        imageSrc:
          "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=2052&auto=format&fit=crop",
        buttonLabel: "Learn more",
        buttonUrl: "/",
      },
      {
        type: "keystatistics",
        title: "Key economic indicators",
        statistics: [
          { label: "GDP Growth, Q1 2025 (YoY)", value: "+3.8%" },
          { label: "Total Merchandise Trade (YoY)", value: "+5.2%" },
          { label: "Manufacturing Output (YoY)", value: "+1.4%" },
        ],
      },
    ],
  },

  campaign: {
    layout: "homepage",
    site: makeSite({
      siteName: "Our Singapore",
      navbar: makeHomeNavbar([
        { name: "About", url: "/about" },
        { name: "Get Involved", url: "/get-involved" },
        { name: "Stories", url: "/stories" },
        { name: "Contact", url: "/contact" },
      ]),
    }),
    meta: { description: "Our Singapore — Together We Build" },
    page: { permalink: "/", lastModified: "", title: "Home" },
    content: [
      {
        type: "hero",
        variant: "block",
        backgroundUrl:
          "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2072&auto=format&fit=crop",
        title: "Together We Build a Better Tomorrow",
        subtitle:
          "Join thousands of Singaporeans coming together to shape the future of our nation — through stories, action, and community.",
        buttonLabel: "Get involved",
        buttonUrl: "/",
        secondaryButtonLabel: "Read our stories",
        secondaryButtonUrl: "/stories",
      },
      {
        type: "infobar",
        variant: "light",
        title: "Every voice matters",
        description:
          "From heartland volunteers to young changemakers, Singaporeans are making a difference every day.",
        buttonLabel: "Share your story",
        buttonUrl: "/",
      },
      {
        type: "infopic",
        title: "Community in action",
        description:
          "Thousands of community initiatives happen each year. Here's how everyday Singaporeans are making a lasting impact.",
        imageAlt: "Community volunteers",
        imageSrc:
          "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop",
        buttonLabel: "See the impact",
        buttonUrl: "/",
      },
      {
        type: "keystatistics",
        title: "Our community, by the numbers",
        statistics: [
          { label: "Volunteers registered", value: "120,000+" },
          { label: "Community projects in 2024", value: "3,400+" },
          { label: "Neighbourhoods reached", value: "All 28" },
        ],
      },
    ],
  },

  formal: {
    layout: "homepage",
    site: makeSite({
      siteName: "Supreme Court of Singapore",
      navbar: makeHomeNavbar([
        { name: "About the Court", url: "/about" },
        { name: "Cases & Judgments", url: "/judgments" },
        { name: "Services", url: "/services" },
        { name: "Contact", url: "/contact" },
      ]),
    }),
    meta: { description: "Supreme Court of Singapore" },
    page: { permalink: "/", lastModified: "", title: "Home" },
    content: [
      {
        type: "hero",
        variant: "floating",
        backgroundUrl:
          "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070&auto=format&fit=crop",
        title: "Upholding Justice for All",
        subtitle:
          "The Supreme Court of Singapore is committed to the fair, efficient, and impartial administration of justice.",
        buttonLabel: "Court services",
        buttonUrl: "/",
        secondaryButtonLabel: "Recent judgments",
        secondaryButtonUrl: "/judgments",
      },
      {
        type: "infobar",
        variant: "light",
        title: "Access to justice",
        description:
          "We provide accessible, efficient and transparent justice for everyone. Find the services, forms, and information you need.",
        buttonLabel: "Find a service",
        buttonUrl: "/",
      },
      {
        type: "infopic",
        title: "A heritage of judicial excellence",
        description:
          "For over a century, the Supreme Court has been the cornerstone of Singapore's legal system, upholding the rule of law.",
        imageAlt: "Supreme Court building",
        imageSrc:
          "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2070&auto=format&fit=crop",
        buttonLabel: "Our history",
        buttonUrl: "/",
      },
      {
        type: "keystatistics",
        title: "The Court in numbers",
        statistics: [
          { label: "Cases filed in 2024", value: "12,400+" },
          { label: "Median disposal time", value: "18 weeks" },
          { label: "Judicial officers", value: "50+" },
        ],
      },
    ],
  },

  modern: {
    layout: "homepage",
    site: makeSite({
      siteName: "DesignSG",
      navbar: makeHomeNavbar([
        { name: "Work", url: "/work" },
        { name: "Studio", url: "/studio" },
        { name: "Research", url: "/research" },
        { name: "Contact", url: "/contact" },
      ]),
    }),
    meta: { description: "DesignSG — Shaping Singapore's Urban Future" },
    page: { permalink: "/", lastModified: "", title: "Home" },
    content: [
      {
        type: "hero",
        variant: "largeImage",
        backgroundUrl:
          "https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=2070&auto=format&fit=crop",
        title: "Designing Singapore's Urban Future",
        subtitle:
          "Bold ideas. Precise execution. We design public spaces, systems, and experiences that define how Singapore lives.",
        buttonLabel: "View our work",
        buttonUrl: "/",
        secondaryButtonLabel: "Join the studio",
        secondaryButtonUrl: "/studio",
      },
      {
        type: "infobar",
        variant: "light",
        title: "Design at the scale of a city",
        description:
          "From wayfinding to waterways, our multidisciplinary team shapes the built environment across Singapore.",
        buttonLabel: "Explore projects",
        buttonUrl: "/",
      },
      {
        type: "infopic",
        title: "Where form meets function",
        description:
          "Every project balances aesthetic precision with practical impact — spaces that work, and spaces that inspire.",
        imageAlt: "Modern Singapore architecture",
        imageSrc:
          "https://images.unsplash.com/photo-1545558014-8692077e9b5c?q=80&w=2070&auto=format&fit=crop",
        buttonLabel: "Our approach",
        buttonUrl: "/",
      },
      {
        type: "keystatistics",
        title: "Our impact",
        statistics: [
          { label: "Projects completed", value: "240+" },
          { label: "Awards won", value: "38" },
          { label: "Public spaces transformed", value: "60 km²" },
        ],
      },
    ],
  },

  school: {
    layout: "homepage",
    site: makeSite({
      siteName: "Raffles Institution",
      navbar: makeHomeNavbar([
        { name: "About", url: "/about" },
        { name: "Academics", url: "/academics" },
        { name: "Co-Curriculum", url: "/cca" },
        { name: "Admissions", url: "/admissions" },
      ]),
    }),
    meta: { description: "Raffles Institution — Nurturing Leaders" },
    page: { permalink: "/", lastModified: "", title: "Home" },
    content: [
      {
        type: "hero",
        variant: "block",
        backgroundUrl:
          "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2071&auto=format&fit=crop",
        title: "Nurturing Leaders of Tomorrow",
        subtitle:
          "At Raffles Institution, we cultivate curious minds, principled leaders, and compassionate citizens ready to make their mark on the world.",
        buttonLabel: "Discover RI",
        buttonUrl: "/",
        secondaryButtonLabel: "Apply now",
        secondaryButtonUrl: "/admissions",
      },
      {
        type: "infobar",
        variant: "light",
        title: "An education that goes beyond academics",
        description:
          "Through a rich curriculum, diverse co-curricular activities, and a vibrant school culture, RI prepares students for life.",
        buttonLabel: "Our programmes",
        buttonUrl: "/",
      },
      {
        type: "infopic",
        title: "A legacy of excellence since 1823",
        description:
          "Singapore's oldest school continues to set the standard in holistic education, producing leaders in every field.",
        imageAlt: "Students at Raffles Institution",
        imageSrc:
          "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=2070&auto=format&fit=crop",
        buttonLabel: "Our history",
        buttonUrl: "/",
      },
      {
        type: "keystatistics",
        title: "RI at a glance",
        statistics: [
          { label: "Students enrolled", value: "2,400+" },
          { label: "CCA groups", value: "60+" },
          { label: "Years of excellence", value: "200+" },
        ],
      },
    ],
  },
}
