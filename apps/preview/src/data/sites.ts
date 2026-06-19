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
        type: "infocards",
        variant: "cardsWithImages",
        maxColumns: "3",
        title: "Key initiatives",
        subtitle: "Explore our programmes and schemes that support businesses and workers.",
        label: "View all initiatives",
        url: "/",
        cards: [
          {
            title: "Enterprise Development Grant",
            url: "/",
            description: "Co-fund projects that help companies upgrade capabilities and venture overseas.",
            imageUrl: "https://placehold.co/400x300/e6ecef/00405f?text=EDG",
            imageAlt: "Enterprise Development Grant",
          },
          {
            title: "Global Innovation Alliance",
            url: "/",
            description: "Connecting Singapore's innovation ecosystem with key global cities and tech hubs.",
            imageUrl: "https://placehold.co/400x300/e6ecef/00405f?text=GIA",
            imageAlt: "Global Innovation Alliance",
          },
          {
            title: "SkillsFuture for Enterprise",
            url: "/",
            description: "Support enterprises in building a culture of lifelong learning.",
            imageUrl: "https://placehold.co/400x300/e6ecef/00405f?text=SFE",
            imageAlt: "SkillsFuture for Enterprise",
          },
        ],
      },
      {
        type: "infocols",
        title: "How we support you",
        subtitle: "Our key areas of focus for enterprise and industry development.",
        infoBoxes: [
          {
            title: "Capability Development",
            description: "Build core business capabilities through training, technology adoption, and innovation.",
            buttonLabel: "Find out more",
            buttonUrl: "/",
            icon: "bar-chart",
          },
          {
            title: "Internationalisation",
            description: "Expand your business overseas with market access, financing, and partnership support.",
            buttonLabel: "Find out more",
            buttonUrl: "/",
            icon: "globe",
          },
          {
            title: "Innovation & IP",
            description: "Develop and protect intellectual property to strengthen your competitive edge.",
            buttonLabel: "Find out more",
            buttonUrl: "/",
            icon: "stars",
          },
        ],
      },
      {
        type: "blockquote",
        quote:
          "Singapore's continued excellence in global competitiveness reflects decades of thoughtful policymaking and an unwavering commitment to openness.",
        source: "IMD World Competitiveness Centre",
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
        type: "infocards",
        variant: "cardsWithFullImages",
        maxColumns: "3",
        title: "Stories from our community",
        subtitle: "Real people, real impact.",
        label: "See all stories",
        url: "/",
        cards: [
          {
            title: "Turning vacant lots into community gardens",
            url: "/",
            description: "How one Bishan resident transformed her neighbourhood.",
            imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=400&h=300&fit=crop",
            imageAlt: "Community garden",
          },
          {
            title: "Teaching code to seniors in Tampines",
            url: "/",
            description: "A 26-year-old volunteer bridging the digital divide.",
            imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=400&h=300&fit=crop",
            imageAlt: "Digital literacy class",
          },
          {
            title: "Young chefs feeding the lonely elderly",
            url: "/",
            description: "Meals and conversation — a weekly ritual that matters.",
            imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=400&h=300&fit=crop",
            imageAlt: "Cooking for the elderly",
          },
        ],
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
        type: "infocols",
        title: "Three ways to get involved",
        subtitle: "Whether you have an hour or a year, there's a place for you.",
        infoBoxes: [
          {
            title: "Volunteer",
            description: "Give your time and skills to causes that matter. Sign up through our volunteer portal.",
            buttonLabel: "Find opportunities",
            buttonUrl: "/",
            icon: "users",
          },
          {
            title: "Share your story",
            description: "Inspire others with your experience. Your story can spark the next movement.",
            buttonLabel: "Submit a story",
            buttonUrl: "/",
            icon: "line-chart",
          },
          {
            title: "Donate",
            description: "Support community projects with a contribution of any size.",
            buttonLabel: "Give now",
            buttonUrl: "/",
            icon: "bar-chart",
          },
        ],
      },
      {
        type: "blockquote",
        quote:
          "When we come together as one people — regardless of race, language, or religion — there is nothing we cannot achieve.",
        source: "Community Leader, Tampines GRC",
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
        type: "infocols",
        title: "Our core values",
        subtitle: "The principles that guide everything we do.",
        infoBoxes: [
          {
            title: "Impartiality",
            description: "Every case is decided on its merits, free from external influence or bias.",
            buttonLabel: "Our process",
            buttonUrl: "/",
            icon: "office-building",
          },
          {
            title: "Transparency",
            description: "Judgments and court processes are published and openly accessible to the public.",
            buttonLabel: "View judgments",
            buttonUrl: "/",
            icon: "line-chart",
          },
          {
            title: "Accessibility",
            description: "We work to ensure every person can navigate the justice system with dignity and ease.",
            buttonLabel: "Court services",
            buttonUrl: "/",
            icon: "users",
          },
        ],
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
        type: "infocards",
        variant: "cardsWithFullImages",
        maxColumns: "3",
        title: "Court services",
        subtitle: "Find the service you need quickly.",
        label: "All services",
        url: "/",
        cards: [
          {
            title: "Filing a civil claim",
            url: "/",
            description: "Step-by-step guide to filing a claim in the High Court.",
            imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=400&h=300&fit=crop",
            imageAlt: "Legal documents",
          },
          {
            title: "Criminal proceedings",
            url: "/",
            description: "Understand how criminal cases are heard and decided.",
            imageUrl: "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?q=80&w=400&h=300&fit=crop",
            imageAlt: "Courtroom",
          },
          {
            title: "Appeals process",
            url: "/",
            description: "How to appeal a decision made in a lower court.",
            imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=300&fit=crop",
            imageAlt: "Appeal documents",
          },
        ],
      },
      {
        type: "blockquote",
        quote:
          "The rule of law is the bedrock upon which Singapore's prosperity and social harmony rest. An independent judiciary is its guardian.",
        source: "Chief Justice of Singapore",
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
        type: "infocards",
        variant: "cardsWithFullImages",
        maxColumns: "3",
        title: "Featured projects",
        subtitle: "Where bold thinking meets real impact.",
        label: "All projects",
        url: "/",
        cards: [
          {
            title: "Jurong Lake District Masterplan",
            url: "/",
            description: "A 360-hectare mixed-use district redefining western Singapore.",
            imageUrl: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?q=80&w=400&h=300&fit=crop",
            imageAlt: "Urban masterplan",
          },
          {
            title: "Rail Corridor Linear Park",
            url: "/",
            description: "24km of reclaimed rail land transformed into a green urban spine.",
            imageUrl: "https://images.unsplash.com/photo-1567416661576-659f17e3cb28?q=80&w=400&h=300&fit=crop",
            imageAlt: "Green corridor",
          },
          {
            title: "Changi Airport T5",
            url: "/",
            description: "The world's most passenger-centric terminal, opening 2030.",
            imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=400&h=300&fit=crop",
            imageAlt: "Airport terminal",
          },
        ],
      },
      {
        type: "infocols",
        title: "Our disciplines",
        subtitle: "Multidisciplinary by design.",
        infoBoxes: [
          {
            title: "Urban Planning",
            description: "Long-range spatial strategies that shape how districts live, work, and move.",
            buttonLabel: "See work",
            buttonUrl: "/",
            icon: "globe",
          },
          {
            title: "Public Space Design",
            description: "Parks, plazas, and streetscapes designed for human connection.",
            buttonLabel: "See work",
            buttonUrl: "/",
            icon: "stars",
          },
          {
            title: "Wayfinding Systems",
            description: "Comprehensive signage and navigation systems deployed citywide.",
            buttonLabel: "See work",
            buttonUrl: "/",
            icon: "office-building",
          },
        ],
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
        type: "blockquote",
        quote:
          "Good design is not how something looks — it is how it shapes the life of the person who uses it, day after day.",
        source: "Chief Design Officer, DesignSG",
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
          "https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=2072&auto=format&fit=crop",
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
        type: "infocards",
        variant: "cardsWithFullImages",
        maxColumns: "3",
        title: "Life at RI",
        subtitle: "Beyond the classroom — discover what makes RI special.",
        label: "Explore school life",
        url: "/",
        cards: [
          {
            title: "Academic Excellence",
            url: "/",
            description: "A rigorous curriculum spanning sciences, humanities, and the arts.",
            imageUrl: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=400&h=300&fit=crop",
            imageAlt: "Students studying",
          },
          {
            title: "Co-curricular Activities",
            url: "/",
            description: "60+ CCAs spanning sports, performing arts, and community service.",
            imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=400&h=300&fit=crop",
            imageAlt: "Students in CCA",
          },
          {
            title: "Global Perspectives",
            url: "/",
            description: "Exchange programmes and overseas learning journeys that broaden horizons.",
            imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=400&h=300&fit=crop",
            imageAlt: "Students at an event",
          },
        ],
      },
      {
        type: "infocols",
        title: "Our educational pillars",
        subtitle: "Four dimensions of holistic development.",
        infoBoxes: [
          {
            title: "Intellectual Curiosity",
            description: "We develop independent thinkers who question, explore, and create.",
            buttonLabel: "Academics",
            buttonUrl: "/",
            icon: "bar-chart",
          },
          {
            title: "Character & Values",
            description: "Leadership, integrity, and compassion are built into everything we do.",
            buttonLabel: "Our values",
            buttonUrl: "/",
            icon: "stars",
          },
          {
            title: "Community Service",
            description: "Students give back through meaningful service-learning programmes.",
            buttonLabel: "Get involved",
            buttonUrl: "/",
            icon: "users",
          },
        ],
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
        type: "blockquote",
        quote:
          "The aim of education is not just to fill a bucket, but to light a fire — and RI has been lighting fires for 200 years.",
        source: "Principal, Raffles Institution",
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
