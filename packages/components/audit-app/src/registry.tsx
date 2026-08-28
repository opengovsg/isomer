import type { IsomerSitemap } from "~/types"
import { generateSiteConfig } from "~/stories/helpers"
import { Blockquote } from "~/templates/next/components/complex/Blockquote"
import { ChildrenPages } from "~/templates/next/components/complex/ChildrenPages"
import { CollectionBlock } from "~/templates/next/components/complex/CollectionBlock"
import { Contentpic } from "~/templates/next/components/complex/Contentpic"
import { Hero } from "~/templates/next/components/complex/Hero"
import { Image } from "~/templates/next/components/complex/Image"
import { ImageGallery } from "~/templates/next/components/complex/ImageGallery"
import { InfoCards } from "~/templates/next/components/complex/InfoCards"
import { Infopic } from "~/templates/next/components/complex/Infopic"
import { LogoCloud } from "~/templates/next/components/complex/LogoCloud"
import { Video } from "~/templates/next/components/complex/Video"
import { BlogCard } from "~/templates/next/components/internal/BlogCard"
import { CollectionCard } from "~/templates/next/components/internal/CollectionCard"
import { ContentPageHeader } from "~/templates/next/components/internal/ContentPageHeader"
import { Navbar } from "~/templates/next/components/internal/Navbar"

import type { TestImage } from "./testImages"

const STORYBOOK_BASE = "https://storybook-next.isomer.gov.sg/?path=/story/"

export type ImageFit = "cover" | "contain"

export interface RowCtx {
  img: TestImage
  fit: ImageFit
}

export interface RowDef {
  id: string
  name: string
  /** Aspect-ratio rules, shown under the row title */
  note: string
  storybook: string
  /** Row exposes the editor cover/contain control */
  hasFitControl?: boolean
  /** Image picker does not apply to this row */
  pickerDoesNotApply?: boolean
  Render: (ctx: RowCtx) => JSX.Element
}

export interface GroupDef {
  id: string
  title: string
  rows: RowDef[]
}

/** Neutral label for stacked variants inside a frame — shell chrome, not component styling */
const VariantLabel = ({ children }: { children: string }) => (
  <div
    style={{
      fontFamily: "Helvetica, Arial, sans-serif",
      fontSize: 12,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: "#8a5b12",
      background: "#fdf3dc",
      padding: "4px 10px",
      margin: "24px 0 8px",
    }}
  >
    {children}
  </div>
)

const site = () => generateSiteConfig()

const prose = (text: string) =>
  ({
    type: "prose",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  }) as const

/** Site whose root's children carry the selected test image (ChildrenPages source) */
const siteWithChildPages = (img: TestImage) => {
  const child = (id: string, title: string): IsomerSitemap => ({
    id,
    title,
    permalink: `/page-${id}`,
    lastModified: "",
    layout: "content",
    summary: "This is some page summary text for the child page.",
    image: { src: img.src, alt: img.alt },
    children: [],
  })
  return generateSiteConfig({
    siteMap: {
      id: "1",
      title: "Home",
      permalink: "/",
      lastModified: "",
      layout: "index",
      summary: "",
      children: [
        child("2", "First child page with a reasonably long title"),
        child("3", "Second child page"),
        child("4", "Third child page about something else"),
      ],
    },
  })
}

/** Site with a collection whose article pages carry the selected test image (CollectionBlock source) */
const siteWithCollection = (img: TestImage, numberOfCards: number) => {
  const card = (id: string, title: string, date: string): IsomerSitemap => ({
    id,
    title,
    permalink: `/collection-1/item-${id}`,
    layout: "article",
    summary: "",
    date,
    lastModified: new Date(date).toISOString(),
    children: [],
    image: { src: img.src, alt: img.alt },
  })
  const cards = [
    card(
      "3",
      "Date of Government Gazette Notification on Dissolution of Parliament",
      "2021-01-03",
    ),
    card(
      "4",
      "Impact of Foreign Professionals on our Economy and Society",
      "2021-01-02",
    ),
    card("5", "Where does Government revenue come from?", "2021-01-01"),
  ].slice(0, numberOfCards)

  return generateSiteConfig({
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
          title: "Corrections and Clarifications",
          permalink: "/collection-1",
          layout: "collection",
          summary: "Clarifying common misperceptions of Government policy.",
          lastModified: "2021-01-01",
          children: cards,
        },
      ],
    },
  })
}

const infoCards = (img: TestImage, fit: ImageFit, n: number) =>
  Array.from({ length: n }, (_, i) => ({
    title: `Card ${i + 1}: a title that spans across a line or two`,
    description:
      "Explore the neighbourhood with us and leave with a full belly and a happy smile.",
    imageUrl: img.src,
    imageAlt: img.alt,
    imageFit: fit,
    url: "/",
  }))

/* ------------------------------------------------------------------ */
/* Group 1 · scales with contained text and screen width               */
/* ------------------------------------------------------------------ */

const group1: RowDef[] = [
  {
    id: "infopic-block",
    name: "Infopic — side-by-side (block)",
    note: "Content band. Mobile: full width, height clamped 200–400px (min-h-[200px] max-h-[400px]), object-cover. lg: image is absolute inset-0 in its half of the grid and crops to whatever height the text column produces.",
    storybook: `${STORYBOOK_BASE}next-components-infopic-block--default`,
    Render: ({ img }) => (
      <Infopic
        type="infopic"
        variant="block"
        title="Explore your great neighbourhood with us"
        description="They will try to close the door on you, just open it. The other day the grass was brown, now it's green because I ain't give up."
        imageSrc={img.src}
        imageAlt={img.alt}
        buttonLabel="Sign up"
        buttonUrl="/"
        site={site()}
        headingLevel={2}
      />
    ),
  },
  {
    id: "hero-gradient",
    name: "Hero — gradient",
    note: "Content band. Band min-height 240px → 360px (sm) → 500px (lg), grows with copy; image object-cover object-center behind a left→right black gradient (85%→10%). Crop = viewport ratio × copy length.",
    storybook: `${STORYBOOK_BASE}next-components-hero--gradient`,
    Render: ({ img }) => (
      <Hero
        variant="gradient"
        title="Ministry of Trade and Industry"
        subtitle="A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity"
        buttonLabel="Main CTA"
        buttonUrl="/"
        secondaryButtonLabel="Sub CTA"
        secondaryButtonUrl="/"
        backgroundUrl={img.src}
        site={site()}
        headingLevel={1}
      />
    ),
  },
  {
    id: "hero-block",
    name: "Hero — split (block)",
    note: "Content band. Mobile: image panel is a hard 320px tall (h-80) below the text. lg: right half, min 500px, stretches to whatever the text column needs; object-cover.",
    storybook: `${STORYBOOK_BASE}next-components-hero--colour-block`,
    Render: ({ img }) => (
      <Hero
        variant="block"
        theme="default"
        title="Your hero title goes here, please keep it short and sweet"
        subtitle="A test for a subtitle that expands the hero banner to show how the image crop follows the text height."
        buttonLabel="Main CTA"
        buttonUrl="/"
        secondaryButtonLabel="Sub CTA"
        secondaryButtonUrl="/"
        backgroundUrl={img.src}
        site={site()}
        headingLevel={1}
      />
    ),
  },
  {
    id: "hero-largeimage",
    name: "Hero — large image",
    note: "Switching frame. aspect-square on mobile → 2:1 from md up, max-height 960px, object-cover. The most aggressive ratio jump in the codebase.",
    storybook: `${STORYBOOK_BASE}next-components-hero--large-image`,
    Render: ({ img }) => (
      <Hero
        variant="largeImage"
        title="Your hero title goes here"
        subtitle="A subtitle for the large-image hero"
        buttonLabel="Main CTA"
        buttonUrl="/"
        backgroundUrl={img.src}
        site={site()}
        headingLevel={1}
      />
    ),
  },
  {
    id: "hero-searchbar",
    name: "Hero — searchbar",
    note: "Content band. Content height on mobile → min 320px (md) → min 384px (lg); object-cover behind a hard-coded #182236 scrim at 80% opacity.",
    storybook: `${STORYBOOK_BASE}next-components-hero--searchbar-with-image`,
    Render: ({ img }) => (
      <Hero
        variant="searchbar"
        title="Search the Isomer website"
        backgroundUrl={img.src}
        site={site()}
        headingLevel={1}
      />
    ),
  },
  {
    id: "contentpageheader",
    name: "ContentPageHeader (content layout banner)",
    note: "Content band. No aspect constraint at all. Mobile: full width below text at ~intrinsic height. lg: right 5/12 columns, object-cover, height dictated by title/summary length.",
    storybook: `${STORYBOOK_BASE}next-internal-components-contentpageheader--with-image`,
    Render: ({ img }) => (
      <ContentPageHeader
        title="Steven Pinker's Rationality"
        summary="Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes."
        breadcrumb={{
          links: [
            { title: "Irrationality", url: "/irrationality" },
            { title: "For Individuals", url: "/irrationality/individuals" },
          ],
        }}
        showThumbnail
        image={{ src: img.src, alt: img.alt }}
        buttonLabel="Submit a proposal"
        buttonUrl="/"
        lastUpdated="2024-01-01"
        site={site()}
      />
    ),
  },
]

/* ------------------------------------------------------------------ */
/* Group 2 · rigid aspect ratio                                        */
/* ------------------------------------------------------------------ */

const group2: RowDef[] = [
  {
    id: "contentpic",
    name: "Contentpic (Image with Text)",
    note: "Fixed frame. 5:6 portrait at full width on mobile → hard 200×240px box from sm up; object-cover, rounded 4px.",
    storybook: `${STORYBOOK_BASE}next-components-contentpic--default`,
    Render: ({ img }) => (
      <Contentpic
        imageSrc={img.src}
        imageAlt={img.alt}
        content={prose(
          "Professor Rhino Bean is the distinguished head of the Department of Improbable Studies. This block was designed for headshots with text beside them.",
        )}
        site={site()}
        headingLevel={2}
      />
    ),
  },
  {
    id: "blockquote-content",
    name: "Blockquote (content/article page)",
    note: "Fixed frame. 96px × 96px circle (rounded-full) at every breakpoint; object-cover. Designed for a speaker's profile photo.",
    storybook: `${STORYBOOK_BASE}next-components-blockquote--with-image`,
    Render: ({ img }) => (
      <Blockquote
        quote="The best way to predict the future is to invent it."
        source="Someone famous"
        imageSrc={img.src}
        imageAlt={img.alt}
        layout="content"
        site={site()}
      />
    ),
  },
  {
    id: "blockquote-homepage",
    name: "Blockquote (homepage)",
    note: "Fixed frame. 240px × 240px square (no rounding) at every breakpoint; object-cover. Same schema field as the content-page variant — the shape flips with page layout, not an editor setting.",
    storybook: `${STORYBOOK_BASE}next-components-blockquote--homepage-without-image`,
    Render: ({ img }) => (
      <Blockquote
        quote="The best way to predict the future is to invent it."
        source="Someone famous"
        imageSrc={img.src}
        imageAlt={img.alt}
        layout="homepage"
        site={site()}
      />
    ),
  },
  {
    id: "hero-floating",
    name: "Hero — floating",
    note: "Fixed frame. True 3:2 at every breakpoint; object-cover. lg: 66.67% width, right-aligned, with the text card overlapping via negative margins.",
    storybook: `${STORYBOOK_BASE}next-components-hero--floating`,
    Render: ({ img }) => (
      <Hero
        variant="floating"
        theme="default"
        title="Your hero title goes here"
        subtitle="A subtitle for the floating hero variant"
        buttonLabel="Main CTA"
        buttonUrl="/"
        backgroundUrl={img.src}
        site={site()}
        headingLevel={1}
      />
    ),
  },
  {
    id: "collectioncard",
    name: "CollectionCard (collection layout rows)",
    note: "Fixed frame. Hard 200×160px box (5:4) at every breakpoint — the only listing thumbnail that never scales with the viewport. object-cover (contain when the thumbnail is the site-logo fallback); rounded 4px.",
    storybook: `${STORYBOOK_BASE}next-internal-components-collectioncard--default`,
    Render: ({ img }) => (
      <CollectionCard
        itemTitle="A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials"
        description="We've looked at how people's spending correlates with how much microscopic plastic they consumed over the year."
        formattedDate="2 Dec 2023"
        image={{ src: img.src, alt: img.alt }}
        imageSrc={img.src}
        referenceLinkHref="/"
        plaintextTags={[]}
        pillTags={[]}
        siteAssetsBaseUrl={undefined}
        headingLevel={3}
      />
    ),
  },
]

/* ------------------------------------------------------------------ */
/* Group 3 · fluid aspect ratio                                        */
/* ------------------------------------------------------------------ */

const group3: RowDef[] = [
  {
    id: "infocards-images",
    name: "InfoCards — cards with images",
    note: "Switching frame. 3:2 base; on a content page with 3 columns the frame becomes 1:1 at lg; on a homepage with 2 columns it becomes 2:1 at lg. Editor radio 'Image display': cover (default) / contain. Rounded 8px + border.",
    storybook: `${STORYBOOK_BASE}next-components-infocards--with-image-3-columns`,
    hasFitControl: true,
    Render: ({ img, fit }) => (
      <>
        <VariantLabel>Content page · 3 columns (3:2 → 1:1 at lg)</VariantLabel>
        <InfoCards
          type="infocards"
          variant="cardsWithImages"
          title="Section title ipsum"
          subtitle="Section subtitle paragraph"
          maxColumns="3"
          cards={infoCards(img, fit, 3)}
          layout="content"
          site={site()}
          headingLevel={2}
        />
        <VariantLabel>Homepage · 2 columns (3:2 → 2:1 at lg)</VariantLabel>
        <InfoCards
          type="infocards"
          variant="cardsWithImages"
          title="Section title ipsum"
          subtitle="Section subtitle paragraph"
          maxColumns="2"
          cards={infoCards(img, fit, 2)}
          layout="homepage"
          site={site()}
          headingLevel={2}
        />
      </>
    ),
  },
  {
    id: "infocards-fullimages",
    name: "InfoCards — cards with full images",
    note: "Switching frame. Card is aspect-square → 2:3 portrait at lg; image fills the card behind a bottom-50% black gradient scrim carrying the title. Same editor fit radio; no rounding.",
    storybook: `${STORYBOOK_BASE}next-components-infocards--with-full-images`,
    hasFitControl: true,
    Render: ({ img, fit }) => (
      <InfoCards
        type="infocards"
        variant="cardsWithFullImages"
        title="Section title ipsum"
        subtitle="Section subtitle paragraph"
        maxColumns="3"
        cards={infoCards(img, fit, 3).map(({ description: _d, ...c }) => c)}
        layout="homepage"
        site={site()}
        headingLevel={2}
      />
    ),
  },
  {
    id: "collectionblock",
    name: "CollectionBlock",
    note: "Switching frame. 3:2 — but when the referenced collection has exactly 2 pages the frame becomes 2:1 at lg. Content, not a setting, decides the crop. Fit is automatic (cover; contain for the site-logo fallback). Rounded 8px + border.",
    storybook: `${STORYBOOK_BASE}next-components-collectionblock--with-image`,
    Render: ({ img }) => (
      <>
        <VariantLabel>3 pages in collection (3:2 everywhere)</VariantLabel>
        <CollectionBlock
          type="collectionblock"
          collectionReferenceLink="[resource:1:2]"
          displayThumbnail
          displayCategory={false}
          buttonLabel="View all corrections"
          site={siteWithCollection(img, 3)}
          headingLevel={2}
        />
        <VariantLabel>2 pages in collection (3:2 → 2:1 at lg)</VariantLabel>
        <CollectionBlock
          type="collectionblock"
          collectionReferenceLink="[resource:1:2]"
          displayThumbnail
          displayCategory={false}
          buttonLabel="View all corrections"
          site={siteWithCollection(img, 2)}
          headingLevel={2}
        />
      </>
    ),
  },
  {
    id: "childrenpages-rows",
    name: "ChildrenPages — rows",
    note: "Fixed 3:2 frame at all sizes; the thumbnail column spans full width on mobile → 2/6 (md) → 3/12 (lg). Editor radio 'Thumbnail display': cover / contain. Rounded 8px + border. Pages without an image fall back to the site logo at ⅔ width, contained.",
    storybook: `${STORYBOOK_BASE}next-internal-components-childrenpages--base-rows`,
    hasFitControl: true,
    Render: ({ img, fit }) => (
      <ChildrenPages
        variant="rows"
        permalink="/"
        showSummary
        showThumbnail
        imageFit={fit}
        site={siteWithChildPages(img)}
        headingLevel={2}
      />
    ),
  },
  {
    id: "childrenpages-boxes",
    name: "ChildrenPages — boxes",
    note: "Switching frame — inherits the InfoCards rules wholesale: 3:2 base, and with 3 columns the frame becomes 1:1 at lg. Same editor fit radio. Logo fallback at ½ size, contained.",
    storybook: `${STORYBOOK_BASE}next-internal-components-childrenpages--default`,
    hasFitControl: true,
    Render: ({ img, fit }) => (
      <>
        <VariantLabel>2 columns (3:2 everywhere)</VariantLabel>
        <ChildrenPages
          variant="boxes"
          permalink="/"
          showSummary
          showThumbnail
          maxColumns="2"
          imageFit={fit}
          site={siteWithChildPages(img)}
          headingLevel={2}
        />
        <VariantLabel>3 columns (3:2 → 1:1 at lg)</VariantLabel>
        <ChildrenPages
          variant="boxes"
          permalink="/"
          showSummary
          showThumbnail
          maxColumns="3"
          imageFit={fit}
          site={siteWithChildPages(img)}
          headingLevel={2}
        />
      </>
    ),
  },
  {
    id: "blogcard",
    name: "BlogCard (blog layout grid)",
    note: "Fixed frame. 2:1 with min-height 160px, full card width, above the text. Same data as CollectionCard, different frame (2:1 vs 5:4) purely because the layout variant switched. object-cover (contain on logo fallback); rounded 4px.",
    storybook: `${STORYBOOK_BASE}next-internal-components-blog-card--default`,
    Render: ({ img }) => (
      <div style={{ maxWidth: 480, padding: 16 }}>
        <BlogCard
          itemTitle="A journal on microscopic plastic and their correlation to staycations"
          description="We've looked at how people's spending correlates with how much microscopic plastic they consumed over the year."
          formattedDate="2 Dec 2023"
          image={{ src: img.src, alt: img.alt }}
          imageSrc={img.src}
          referenceLinkHref="/"
          plaintextTags={[]}
          pillTags={[]}
          siteAssetsBaseUrl={undefined}
          headingLevel={3}
        />
      </div>
    ),
  },
]

/* ------------------------------------------------------------------ */
/* Group 4 · image as-is                                               */
/* ------------------------------------------------------------------ */

const group4: RowDef[] = [
  {
    id: "image",
    name: "Image (native content block)",
    note: "Intrinsic — never cropped. h-auto max-w-full keeps the upload's own ratio at every breakpoint. 'Small' size: min-width 100% → 67% (md) → 50% (lg). Rounded 4px.",
    storybook: `${STORYBOOK_BASE}next-components-image--default`,
    Render: ({ img }) => (
      <div style={{ padding: 16 }}>
        <VariantLabel>Size: fill page width (default)</VariantLabel>
        <Image
          src={img.src}
          alt={img.alt}
          caption="A caption for the image"
          size="default"
          site={site()}
        />
        <VariantLabel>Size: small</VariantLabel>
        <Image
          src={img.src}
          alt={img.alt}
          caption="A caption for the image"
          size="smaller"
          site={site()}
        />
      </div>
    ),
  },
  {
    id: "imagegallery",
    name: "ImageGallery",
    note: "Letterboxed. Fixed stage: 272px tall on mobile → 456px tall from sm; object-contain on a white stage — the whole image is always visible, never cropped. Thumbnails hidden below sm; 3-up at 118px (sm) / 5-up at 86px (lg), ratio floats with column width.",
    storybook: `${STORYBOOK_BASE}next-components-imagegallery--default`,
    Render: ({ img }) => (
      <ImageGallery
        images={Array.from({ length: 5 }, (_, i) => ({
          src: img.src,
          alt: img.alt,
          caption: `Image ${i + 1} of 5 — ${img.label}`,
        }))}
        site={site()}
      />
    ),
  },
  {
    id: "logocloud",
    name: "LogoCloud",
    note: "Intrinsic — never cropped. object-contain with width auto; only a max-height cap applies: 80px on mobile → 96px from md. Wide and square logos get visibly different footprints.",
    storybook: `${STORYBOOK_BASE}next-components-logo-cloud--default`,
    Render: ({ img }) => (
      <LogoCloud
        images={Array.from({ length: 3 }, () => ({
          src: img.src,
          alt: img.alt,
        }))}
        title="With grateful thanks to our partners"
        site={site()}
      />
    ),
  },
  {
    id: "navbar-logo",
    name: "Navbar logo",
    note: "Intrinsic — never cropped. object-contain object-left; caps at 48px tall × 128px wide (68×180 at lg when a utility navigation is configured).",
    storybook: `${STORYBOOK_BASE}next-internal-components-navbar--default`,
    Render: ({ img }) => (
      <Navbar
        layout="homepage"
        logoUrl={img.src}
        logoAlt={img.alt}
        search={{ type: "localSearch", searchUrl: "/search" }}
        items={[
          { name: "About us", url: "/about" },
          { name: "Newsroom", url: "/newsroom" },
        ]}
        site={site()}
      />
    ),
  },
  {
    id: "video",
    name: "Video",
    note: "Fixed frame. 16:9 (or 9:16 portrait capped at 325px wide). The thumbnail is auto-fetched from YouTube/Vimeo and shown object-cover on black — the image picker does not apply to this row.",
    storybook: `${STORYBOOK_BASE}next-components-video--you-tube`,
    pickerDoesNotApply: true,
    Render: () => (
      <Video
        title="Rick Astley - Never Gonna Give You Up"
        url="https://www.youtube.com/embed/dQw4w9WgXcQ"
      />
    ),
  },
]

export const GROUPS: GroupDef[] = [
  {
    id: "text-and-screen",
    title: "Scales with text & screen width",
    rows: group1,
  },
  {
    id: "rigid",
    title: "Rigid aspect ratio",
    rows: group2,
  },
  {
    id: "fluid",
    title: "Fluid aspect ratio",
    rows: group3,
  },
  {
    id: "as-is",
    title: "Image as-is",
    rows: group4,
  },
]

export const findRow = (id: string): RowDef | undefined =>
  GROUPS.flatMap((g) => g.rows).find((r) => r.id === id)
