import type { IsomerComponent } from "@opengovsg/isomer-components"
import { DEFAULT_CHILDREN_PAGES_BLOCK } from "@opengovsg/isomer-components"

// TODO: add in default blocks for remaining
export const DEFAULT_BLOCKS = {
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
  childrenpages: DEFAULT_CHILDREN_PAGES_BLOCK,
  accordion: {
    type: "accordion",
    summary: "Title for the accordion item",
    details: {
      type: "prose",
      content: [],
    },
  },
  blockquote: {
    type: "blockquote",
    quote: "Enter your quote here.",
    source: "Describe who said the quote.",
    imageAlt: "Enter a descriptive alt text.",
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
              text: "We’re closing applications for this position on Thursday, July 3rd. Make sure to apply by then.",
            },
          ],
        },
      ],
    },
  },
  formsg: {
    type: "formsg",
    url: "https://form.gov.sg/686e73c1a1f7bf391ee2b3af",
    title: "Fill in a sample feedback form for Isomer.",
  },
  hero: undefined,
  iframe: {
    type: "iframe",
    title: "YouTube embed",
    content:
      '<iframe width="560" height="315" src="https://www.youtube.com/embed/GzQiJ091g7Q?si=GePcnmUmvmGk77fz" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
  },
  image: {
    type: "image",
    src: "/placeholder_no_image.png",
    alt: "Enter a descriptive alt text.",
    size: "default",
  },
  infobar: {
    type: "infobar",
    title: "Enter a strong message or call-to-action.",
    description: "Elaborate on the title.",
  },
  infocards: {
    type: "infocards",
    title: "Enter a title.",
    subtitle: "Elaborate on the title.",
    variant: "cardsWithImages",
    maxColumns: "3",
    cards: [
      {
        title: "Enter a title for your first card.",
        url: "https://www.google.com",
        imageUrl: "/placeholder_no_image.png",
        imageAlt: "Enter a descriptive alt text.",
        imageFit: "cover",
      },
      {
        title: "Enter a title for your second card.",
        url: "https://www.google.com",
        imageUrl: "/placeholder_no_image.png",
        imageAlt: "Enter a descriptive alt text.",
        imageFit: "cover",
      },
      {
        title: "Enter a title for your third card.",
        url: "https://www.google.com",
        imageUrl: "/placeholder_no_image.png",
        imageAlt: "Enter a descriptive alt text.",
        imageFit: "cover",
      },
    ],
  },
  infocols: {
    type: "infocols",
    title: "Enter a title.",
    subtitle: "Elaborate on the title.",
    infoBoxes: [
      {
        title: "Enter a title for your first column.",
        description: "Elaborate on the title.",
        icon: "office-building",
      },
      {
        title: "Enter a title for your second column.",
        description: "Elaborate on the title.",
        icon: "stars",
      },
      {
        title: "Enter a title for your third column.",
        description: "Elaborate on the title.",
        icon: "globe",
      },
    ],
  },
  infopic: {
    type: "infopic",
    title: "Enter a title.",
    description: "Elaborate on the title.",
    imageSrc: "/placeholder_no_image.png",
    imageAlt: "Enter a descriptive alt text.",
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
              text: "Enter content to place beside the image.",
              type: "text",
            },
          ],
        },
      ],
    },
    imageSrc: "/placeholder_no_image.png",
    imageAlt: "Describe what the image is about.",
  },
  keystatistics: {
    type: "keystatistics",
    title: "Enter a title.",
    statistics: [
      {
        label: "Enter a label for each item.",
        value: "Example",
      },
      {
        label: "Show growth numbers",
        value: "+12.2%",
      },
      {
        label: "Use commas for big numbers",
        value: "12,890",
      },
      {
        label: "Highlight core values",
        value: "Integrity",
      },
    ],
  },
  map: {
    type: "map",
    title: "Map of the Singapore region",
    url: "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d127639.0647119137!2d103.79481771806647!3d1.343949056391766!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2ssg!4v1731681854346!5m2!1sen!2ssg",
  },
  audio: {
    type: "audio",
    title:
      "Play podcast: As scammers adapt and evolve, how can technology keep up?",
    url: "https://open.spotify.com/embed/episode/1xaBZfZ3tffBZdgBdy1Kh6",
  },
  video: {
    type: "video",
    title: "Play video: Kit Chan sings 'Home' at NDP 2025",
    url: "https://www.youtube.com/embed/GzQiJ091g7Q?si=GePcnmUmvmGk77fz",
  },
  // TODO: Replace with actual working API endpoint
  dynamicdatabanner: {
    type: "dynamicdatabanner",
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
    errorMessage: [
      {
        type: "text",
        text: "Oops! Having trouble loading the data. Try refreshing — that usually does the trick!",
      },
    ],
  },
  antiscambanner: {
    type: "antiscambanner",
  },
  logocloud: {
    type: "logocloud",
    images: [
      {
        src: "/placeholder_no_image.png",
        alt: "Enter a descriptive alt text.",
      },
      {
        src: "/placeholder_no_image.png",
        alt: "Enter a descriptive alt text.",
      },
      {
        src: "/placeholder_no_image.png",
        alt: "Enter a descriptive alt text.",
      },
    ],
    title: "Our partners",
  },
  collectionblock: {
    type: "collectionblock",
    collectionReferenceLink: "", // TODO: placeholder for now as we cannot select a collection beforehand but it's required by the schema
    buttonLabel: "Read all latest news",
    displayThumbnail: true,
    displayCategory: true,
  },
  imagegallery: {
    type: "imagegallery",
    images: [
      {
        caption: "Enter a caption to describe the image or attribute it.",
        src: "/placeholder_no_image.png",
        alt: "Enter a descriptive alt text.",
      },
      {
        caption: "Enter a caption to describe the image or attribute it.",
        src: "/placeholder_no_image.png",
        alt: "Enter a descriptive alt text.",
      },
      {
        caption: "Enter a caption to describe the image or attribute it.",
        src: "/placeholder_no_image.png",
        alt: "Enter a descriptive alt text.",
      },
    ],
  },
  contactinformation: {
    type: "contactinformation",
    title: "Contact us",
    methods: [
      {
        method: "email",
        label: "Email",
        values: ["contact@example.com"],
      },
    ],
  },
  dynamiccomponentlist: {
    type: "dynamiccomponentlist",
    dataSource: {
      type: "dgs",
      resourceId: "PLACEHOLDER_RESOURCE_ID",
    },
    component: {
      type: "contactinformation",
      title: "[dgs:entity_name]",
      description: "[dgs:description]",
      methods: "[dgs:methods]",
      otherInformation: "[dgs:other_information]",
    },
  },
}

export const BLOCK_TO_META: Record<
  IsomerComponent["type"],
  { label: string; description: string; usageText?: string; imageSrc?: string }
> = {
  hero: {
    label: "Hero banner",
    description: "Title, summary, hero image, and Call-to-Action.",
  },
  childrenpages: {
    label: "Child pages",
    description: "Automatically display all child pages in this folder.",
    imageSrc: "/assets/block-images/Childrenpages.png",
  },
  image: {
    label: "Image",
    description: "Add an image with caption.",
    usageText: "Evoke emotions by adding an authentic image.",
    imageSrc: "/assets/block-images/Image.png",
  },
  prose: {
    label: "Text",
    description: "Add text, links, lists, and tables.",
    imageSrc: "/assets/block-images/Text.png",
  },
  callout: {
    label: "Callout",
    description: "Bring attention to important information.",
    usageText:
      "Highlight information that is out of the ordinary, like changes or updates.",
    imageSrc: "/assets/block-images/Callout.png",
  },
  keystatistics: {
    label: "Statistics",
    description: "Display metrics that represent your agency.",
    usageText: "Share key wins or highlight your values in short words.",
    imageSrc: "/assets/block-images/KeyStatistics.png",
  },
  infobar: {
    label: "Call-to-Action",
    description: "Add a strong Call-to-Action.",
    usageText:
      "Add a strong punchline, or use to get conversions like sign-ups and subscriptions.",
    imageSrc: "/assets/block-images/Infobar.png",
  },
  contentpic: {
    label: "Image with text",
    description: "Put image and text side-by-side.",
    usageText: "Introduce people with their headshots or show report covers.",
    imageSrc: "/assets/block-images/Contentpic.png",
  },
  infopic: {
    label: "Image with text",
    description: "Place an image with a text and Call-to-Action.",
    imageSrc: "/assets/block-images/Infopic.png",
  },
  accordion: {
    label: "Accordion",
    description: "Hide content in expandable accordions.",
    usageText:
      "Show content that isn't relevant to every reader, but only to some readers.",
    imageSrc: "/assets/block-images/Accordion.png",
  },
  infocards: {
    label: "Cards",
    description: "Link your pages using cards.",
    imageSrc: "/assets/block-images/InfoCards.png",
  },
  infocols: {
    label: "Columns of text",
    description: "Show links using multiple columns and icons.",
    imageSrc: "/assets/block-images/Infocol.png",
  },
  iframe: {
    label: "Embed",
    description: "Embed content from external websites.",
  },
  map: {
    label: "Map",
    description: "Embed a map of a location or an area.",
    usageText: "Direct people to your office or an event location.",
    imageSrc: "/assets/block-images/Map.png",
  },
  // TODO: Add image source (skipped because component not available on studio yet)
  audio: {
    label: "Audio",
    description: "Embed an audio from Spotify or Apple Podcast.",
    usageText: "The audio will be playable directly on the page.",
  },
  video: {
    label: "Video",
    description: "Embed a video from YouTube, Vimeo, or Facebook Watch.",
    usageText: "The video will be playable directly on the page.",
    imageSrc: "/assets/block-images/Video.png",
  },
  dynamicdatabanner: {
    label: "Dynamic Data Banner",
    description: "Display a dynamic data banner.",
    usageText: "This block supports fetching data from an API endpoint.",
  },
  antiscambanner: {
    label: "Anti-scam disclaimer",
    description: "Show a warning against scams.",
    usageText:
      "Comes with a pre-approved text that warns against Government Officials Impersonation Scams.",
    imageSrc: "/assets/block-images/AntiScamDisclaimerBanner.png",
  },
  logocloud: {
    label: "Logo cloud",
    description: "Display logos of partner organisations or accolades.",
    usageText:
      "Upload original logos with transparent backgrounds for the best results.",
    imageSrc: "/assets/block-images/LogoCloud.png",
  },
  collectionblock: {
    // TODO: Add image source
    label: "Link a Collection",
    description: "Automatically display recent items from a Collection.",
    usageText:
      "Keep your website up-to-date with recent items from your newsroom, resources, or blog.",
    imageSrc: "/assets/block-images/CollectionBlock.png",
  },
  imagegallery: {
    // TODO: Add image source
    label: "Image gallery",
    description: "Display up to 30 images in a slideshow.",
    usageText: "Share memorable moments from an event.",
  },
  blockquote: {
    label: "Quote",
    description: "Display a quote or testimonial.",
    usageText:
      "Humanise your site with powerful quotes or stories from real people.",
    imageSrc: "/assets/block-images/Blockquote.png",
  },
  contactinformation: {
    label: "Contact information",
    description: "Display contact information.",
    usageText: "Let people know how they can reach you.",
    // TODO: Add imageSrc
  },
  dynamiccomponentlist: {
    label: "Dynamic component list",
    description: "Display a list of dynamic components.",
    usageText: "Showcase a list of dynamic components.",
    // TODO: Add imageSrc
  },
  formsg: {
    label: "FormSG",
    description: "Embed a form to collect data.",
    usageText:
      "Get mailing list sign-ups or quick feedback directly on the page.",
    imageSrc: "/assets/block-images/FormSG.png",
  },
} as const

type AllowedBlockSections = {
  label: string
  types: IsomerComponent["type"][]
}[]

export const ARTICLE_ALLOWED_BLOCKS: AllowedBlockSections = [
  {
    label: "Basic content blocks",
    types: [
      "prose",
      "image",
      "accordion",
      "callout",
      "blockquote",
      "imagegallery",
    ],
  },
  { label: "Embed external content", types: ["map", "video"] },
]

export const CONTENT_ALLOWED_BLOCKS: AllowedBlockSections = [
  {
    label: "Basic content blocks",
    types: [
      "prose",
      "image",
      "accordion",
      "callout",
      "blockquote",
      "contentpic",
      "infobar",
      "imagegallery",
    ],
  },
  {
    label: "Add a new section",
    types: ["infocards", "infocols", "keystatistics"],
  },
  { label: "Embed external content", types: ["map", "video", "formsg"] },
]

export const INDEX_ALLOWED_BLOCKS: AllowedBlockSections = [
  { label: "Auto-link pages", types: ["childrenpages"] },
  ...CONTENT_ALLOWED_BLOCKS,
]

export const DATABASE_ALLOWED_BLOCKS: AllowedBlockSections =
  CONTENT_ALLOWED_BLOCKS

export const getHomepageAllowedBlocks = ({
  includeAntiScamBanner,
}: {
  includeAntiScamBanner: boolean
}): AllowedBlockSections => [
  {
    label: "Add a new section",
    // TODO(ISOM-1552): Add back iframe component when implemented
    types: [
      "infocards",
      "keystatistics",
      "infocols",
      "infopic",
      "infobar",
      "blockquote",
      "collectionblock",
      "logocloud",
      ...(includeAntiScamBanner ? (["antiscambanner"] as const) : []),
    ],
  },
]
