import type { IsomerComponent } from "@opengovsg/isomer-components"
import { DYNAMIC_DATA_BANNER_TYPE } from "@opengovsg/isomer-components"

// TODO: add in default blocks for remaining
export const DEFAULT_BLOCKS: Record<
  IsomerComponent["type"],
  IsomerComponent | undefined
> = {
  prose: {
    type: "prose",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "",
          },
        ],
      },
    ],
  },
  accordion: {
    type: "accordion",
    summary: "Title for the accordion item",
    details: {
      type: "prose",
      content: [
        {
          type: "paragraph",
        },
      ],
    },
  },
  callout: {
    type: "callout",
    content: {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Callout content",
            },
          ],
        },
      ],
    },
  },
  hero: undefined,
  iframe: {
    type: "iframe",
    title: "YouTube embed",
    content:
      '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=ggGGn4uvFWAIelWD" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
  },
  image: {
    type: "image",
    src: "/placeholder_no_image.png",
    alt: "Add your alt text here",
    size: "default",
  },
  infobar: {
    type: "infobar",
    title: "This is the main title",
    description: "This is an optional description",
  },
  infocards: {
    type: "infocards",
    title: "This is an title of the Infocards component",
    subtitle: "This is an optional subtitle for the Infocards component",
    variant: "cardsWithImages",
    maxColumns: "3",
    cards: [
      {
        title: "This is the first card",
        url: "https://www.google.com",
        imageUrl: "/placeholder_no_image.png",
        imageAlt: "This is the alt text",
        imageFit: "cover",
      },
      {
        title: "This is the second card",
        url: "https://www.google.com",
        imageUrl: "/placeholder_no_image.png",
        imageAlt: "This is the alt text",
        imageFit: "cover",
      },
      {
        title: "This is the third card",
        url: "https://www.google.com",
        imageUrl: "/placeholder_no_image.png",
        imageAlt: "This is the alt text",
        imageFit: "cover",
      },
    ],
  },
  infocols: {
    type: "infocols",
    title: "This is the main title of the InfoCols component",
    subtitle: "This is an optional subtitle for the InfoCols component.",
    infoBoxes: [
      {
        title: "This is the title of the first column",
        description: "You can also add additional description here",
        icon: "office-building",
      },
      {
        title: "This is the title of the second column",
        description: "You can also add additional description here",
        icon: "stars",
      },
      {
        title: "This is the title of the third column",
        description: "You can also add additional description here",
        icon: "globe",
      },
    ],
  },
  infopic: {
    type: "infopic",
    title: "This is an infopic",
    description: "This is the description for the infopic component",
    imageSrc: "/placeholder_no_image.png",
  },
  contentpic: {
    type: "contentpic",
    content: {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            {
              text: "Enter the content accompanying the image here",
              type: "text",
            },
          ],
        },
      ],
    },
    imageSrc: "/placeholder_no_image.png",
    imageAlt: "This is the alt text for the image",
  },
  keystatistics: {
    type: "keystatistics",
    title: "Irrationality in numbers",
    statistics: [
      {
        label: "Average all nighters pulled in a typical calendar month",
        value: "3",
      },
      {
        label: "Growth in tasks assigned Q4 2024 (YoY)",
        value: "+12.2%",
      },
      {
        label: "Creative blocks met per single evening",
        value: "89",
      },
      {
        value: "4.0",
        label: "Number of lies in this stat block",
      },
    ],
  },
  map: {
    type: "map",
    title: "Singapore region",
    url: "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d127639.0647119137!2d103.79481771806647!3d1.343949056391766!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2ssg!4v1731681854346!5m2!1sen!2ssg",
  },
  video: {
    type: "video",
    title: "Rick Astley - Never Gonna Give You Up",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ?si=ggGGn4uvFWAIelWD",
  },
  // TODO: Replace with actual working API endpoint
  [DYNAMIC_DATA_BANNER_TYPE]: {
    type: `${DYNAMIC_DATA_BANNER_TYPE}`,
    apiEndpoint: "https://jsonplaceholder.com/muis_prayers_time",
    title: "hijriDate",
    data: [
      {
        label: "Subuh",
        key: "subuh",
      },
      {
        label: "Syuruk",
        key: "syuruk",
      },
      {
        label: "Zohor",
        key: "zohor",
      },
      {
        label: "Asar",
        key: "asar",
      },
      {
        label: "Maghrib",
        key: "maghrib",
      },
      {
        label: "Ishak",
        key: "isyak",
      },
    ],
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    label: "View all dates",
  },
}

export const BLOCK_TO_META: Record<
  IsomerComponent["type"],
  { label: string; description: string; usageText?: string; imageSrc?: string }
> = {
  hero: {
    label: "Hero banner",
    description: "Title, summary, hero image, and Call-to-Action",
  },
  image: {
    label: "Image",
    description: "Add an image with caption",
    usageText:
      "Get your readers' attention and create emotions by using an image. You can adjust the size of the image.",
    imageSrc: "/assets/block-images/Image.png",
  },
  prose: {
    label: "Text",
    description: "Add a block of text to your page",
    usageText:
      "You can add structure to your content by using features such as headings, lists, links, and body text.",
    imageSrc: "/assets/block-images/Text.png",
  },
  callout: {
    label: "Callout",
    description: "Bring attention to important information",
    usageText:
      "Callouts are great for highlighting information such as updates. We recommend not overusing the callouts.",
    imageSrc: "/assets/block-images/Callout.png",
  },
  keystatistics: {
    label: "Statistics",
    description: "Display KPIs or key statistics for your agency",
    usageText:
      "Do you have metrics to show the public? Designed to be bold, this block supports up to four numbers with labels.",
    imageSrc: "/assets/block-images/KeyStatistics.png",
  },
  infobar: {
    label: "Call-to-Action",
    description: "Add a strong call-to-action",
    usageText:
      "Use this block to highlight key initatives on your homepage. It supports up to two buttons.",
    imageSrc: "/assets/block-images/Infobar.png",
  },
  contentpic: {
    label: "Image with text",
    description: "Put image and text side-by-side",
    usageText:
      "Use this block to juxtapose text next to a smaller image than usual, such as introducing a committee member along with their headshot.",
    imageSrc: "/assets/block-images/Contentpic.png",
  },
  infopic: {
    label: "Text with image",
    description: "Place an image with a text and call-to-action",
    usageText: "This block comes with a button.",
    imageSrc: "/assets/block-images/Infopic.png",
  },
  accordion: {
    label: "Accordion",
    description: "Display content in expandable accordions",
    usageText:
      "Accordions hide details by default, so they are great for content that isn't relevant to every reader.",
    imageSrc: "/assets/block-images/Accordion.png",
  },
  infocards: {
    label: "Cards",
    description: `Link information in "cards" with or without images`,
    usageText: "This block supports up to six cards.",
    imageSrc: "/assets/block-images/InfoCards.png",
  },
  infocols: {
    label: "Columns of text",
    description: "Show important links in multiple columns",
    usageText: "This block supports up to six links.",
    imageSrc: "/assets/block-images/Infocol.png",
  },
  iframe: {
    label: "Embed",
    description: "Embed a video or other content",
    usageText: "This block supports embedding content from other websites.",
  },
  map: {
    label: "Map",
    description: "Embed a map of a location or area",
    usageText: "Embed a map to show your offices or an event location.",
    imageSrc: "/assets/block-images/Map.png",
  },
  video: {
    label: "Video",
    description: "Embed an external video",
    usageText:
      "You can embed videos hosted on platforms such as YouTube and Vimeo.",
    imageSrc: "/assets/block-images/Video.png",
  },
  [DYNAMIC_DATA_BANNER_TYPE]: {
    label: "Dynamic Data Banner",
    description: "Display dynamic data banner",
    usageText: "This block supports fetching data from an API endpoint.",
  },
}

type AllowedBlockSections = {
  label: string
  types: IsomerComponent["type"][]
}[]

export const ARTICLE_ALLOWED_BLOCKS: AllowedBlockSections = [
  {
    label: "Basic content blocks",
    types: ["prose", "image", "accordion", "callout"],
  },
  { label: "Embed external content", types: ["map", "video"] },
]

export const CONTENT_ALLOWED_BLOCKS: AllowedBlockSections = [
  {
    label: "Basic content blocks",
    types: ["prose", "image", "accordion", "callout", "contentpic", "infobar"],
  },
  {
    label: "Add a new section",
    types: ["infocards", "infocols", "keystatistics"],
  },
  { label: "Embed external content", types: ["map", "video"] },
]
export const HOMEPAGE_ALLOWED_BLOCKS: AllowedBlockSections = [
  {
    label: "Add a new section",
    // TODO(ISOM-1552): Add back iframe component when implemented
    types: ["infocards", "keystatistics", "infocols", "infopic", "infobar"],
  },
]
