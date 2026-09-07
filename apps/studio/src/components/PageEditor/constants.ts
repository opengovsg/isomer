import type { IsomerComponent } from "@opengovsg/isomer-components"
import { DEFAULT_CHILDREN_PAGES_BLOCK } from "@opengovsg/isomer-components"

// TODO: add in default blocks for remaining
export const DEFAULT_BLOCKS = {
  prose: {
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
    type: "prose",
  },
  childrenpages: DEFAULT_CHILDREN_PAGES_BLOCK,
  accordion: {
    details: {
      content: [],
      type: "prose",
    },
    summary: "Title for the accordion item",
    type: "accordion",
  },
  blockquote: {
    imageAlt: "Enter a descriptive alt text.",
    quote: "Enter your quote here.",
    source: "Describe who said the quote.",
    type: "blockquote",
  },
  button: {
    alignment: "left",
    buttonLabel: "Enter your button text.",
    buttonUrl: "https://www.google.com",
    type: "button",
  },
  callout: {
    content: {
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
      type: "prose",
    },
    type: "callout",
  },
  formsg: {
    title: "Fill in a sample feedback form for Isomer.",
    type: "formsg",
    url: "https://form.gov.sg/686e73c1a1f7bf391ee2b3af",
  },
  hero: undefined,
  iframe: {
    content:
      '<iframe width="560" height="315" src="https://www.youtube.com/embed/GzQiJ091g7Q?si=GePcnmUmvmGk77fz" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
    title: "YouTube embed",
    type: "iframe",
  },
  image: {
    alt: "Enter a descriptive alt text.",
    size: "default",
    src: "/placeholder_no_image.png",
    type: "image",
  },
  infobar: {
    description: "Elaborate on the title.",
    title: "Enter a strong message or call-to-action.",
    type: "infobar",
  },
  infocards: {
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
    maxColumns: "3",
    subtitle: "Elaborate on the title.",
    title: "Enter a title.",
    type: "infocards",
    variant: "cardsWithImages",
  },
  infocols: {
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
    subtitle: "Elaborate on the title.",
    title: "Enter a title.",
    type: "infocols",
  },
  infopic: {
    description: "Elaborate on the title.",
    imageAlt: "Enter a descriptive alt text.",
    imageSrc: "/placeholder_no_image.png",
    title: "Enter a title.",
    type: "infopic",
  },
  contentpic: {
    content: {
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
      type: "prose",
    },
    imageAlt: "Describe what the image is about.",
    imageSrc: "/placeholder_no_image.png",
    type: "contentpic",
  },
  keystatistics: {
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
    title: "Enter a title.",
    type: "keystatistics",
  },
  map: {
    title: "Map of the Singapore region",
    type: "map",
    url: "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d127639.0647119137!2d103.79481771806647!3d1.343949056391766!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2ssg!4v1731681854346!5m2!1sen!2ssg",
  },
  audio: {
    title:
      "Play podcast: As scammers adapt and evolve, how can technology keep up?",
    type: "audio",
    url: "https://open.spotify.com/embed/episode/1xaBZfZ3tffBZdgBdy1Kh6",
  },
  video: {
    title: "Play video: Kit Chan sings 'Home' at NDP 2025",
    type: "video",
    url: "https://www.youtube.com/embed/GzQiJ091g7Q?si=GePcnmUmvmGk77fz",
  },
  // TODO: Replace with actual working API endpoint
  dynamicdatabanner: {
    apiEndpoint: "https://jsonplaceholder.com/muis_prayers_time",
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
    errorMessage: [
      {
        type: "text",
        text: "Oops! Having trouble loading the data. Try refreshing — that usually does the trick!",
      },
    ],
    label: "View all dates",
    title: "hijriDate",
    type: "dynamicdatabanner",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  antiscambanner: {
    type: "antiscambanner",
  },
  logocloud: {
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
    type: "logocloud",
  },
  collectionblock: {
    buttonLabel: "Read all latest news",
    collectionReferenceLink: "", // TODO: placeholder for now as we cannot select a collection beforehand but it's required by the schema
    displayCategory: true,
    displayThumbnail: true,
    type: "collectionblock",
  },
  imagegallery: {
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
    type: "imagegallery",
  },
  contactinformation: {
    methods: [
      {
        method: "email",
        label: "Email",
        values: ["contact@example.com"],
      },
    ],
    title: "Contact us",
    type: "contactinformation",
  },
  dynamiccomponentlist: {
    component: {
      description: "[dgs:description]",
      methods: "[dgs:methods]",
      otherInformation: "[dgs:other_information]",
      title: "[dgs:entity_name]",
      type: "contactinformation",
    },
    dataSource: {
      resourceId: "PLACEHOLDER_RESOURCE_ID",
      type: "dgs",
    },
    type: "dynamiccomponentlist",
  },
}

export const BLOCK_TO_META = {
  hero: {
    description: "Title, summary, hero image, and Call-to-Action.",
    label: "Hero banner",
  },
  childrenpages: {
    description: "Automatically display all child pages in this folder.",
    imageSrc: "/assets/block-images/Childrenpages.png",
    label: "Child pages",
  },
  image: {
    description: "Add an image with caption.",
    imageSrc: "/assets/block-images/Image.png",
    label: "Image",
    usageText: "Evoke emotions by adding an authentic image.",
  },
  prose: {
    description: "Add text, links, lists, and tables.",
    imageSrc: "/assets/block-images/Text.png",
    label: "Text",
  },
  callout: {
    description: "Bring attention to important information.",
    imageSrc: "/assets/block-images/Callout.png",
    label: "Callout",
    usageText:
      "Highlight information that is out of the ordinary, like changes or updates.",
  },
  keystatistics: {
    description: "Display metrics that represent your agency.",
    imageSrc: "/assets/block-images/KeyStatistics.png",
    label: "Statistics",
    usageText: "Share key wins or highlight your values in short words.",
  },
  infobar: {
    description: "Add a strong Call-to-Action.",
    imageSrc: "/assets/block-images/Infobar.png",
    label: "Call-to-Action",
    usageText:
      "Add a strong punchline, or use to get conversions like sign-ups and subscriptions.",
  },
  contentpic: {
    description: "Put image and text side-by-side.",
    imageSrc: "/assets/block-images/Contentpic.png",
    label: "Image with text",
    usageText: "Introduce people with their headshots or show report covers.",
  },
  infopic: {
    description: "Place an image with a text and Call-to-Action.",
    imageSrc: "/assets/block-images/Infopic.png",
    label: "Image with text",
  },
  accordion: {
    description: "Hide content in expandable accordions.",
    imageSrc: "/assets/block-images/Accordion.png",
    label: "Accordion",
    usageText:
      "Show content that isn't relevant to every reader, but only to some readers.",
  },
  infocards: {
    description: "Link your pages using cards.",
    imageSrc: "/assets/block-images/InfoCards.png",
    label: "Cards",
  },
  infocols: {
    description: "Show links using multiple columns and icons.",
    imageSrc: "/assets/block-images/Infocol.png",
    label: "Columns of text",
  },
  iframe: {
    description: "Embed content from external websites.",
    label: "Embed",
  },
  map: {
    description: "Embed a map of a location or an area.",
    imageSrc: "/assets/block-images/Map.png",
    label: "Map",
    usageText: "Direct people to your office or an event location.",
  },
  // TODO: Add image source (skipped because component not available on studio yet)
  audio: {
    description: "Embed an audio from Spotify or Apple Podcast.",
    imageSrc: "/assets/block-images/Podcast.png",
    label: "Audio",
    usageText: "The audio will be playable directly on the page.",
  },
  video: {
    description: "Embed a video from YouTube, Vimeo, or Facebook Watch.",
    imageSrc: "/assets/block-images/Video.png",
    label: "Video",
    usageText: "The video will be playable directly on the page.",
  },
  dynamicdatabanner: {
    description: "Display a dynamic data banner.",
    label: "Dynamic Data Banner",
    usageText: "This block supports fetching data from an API endpoint.",
  },
  antiscambanner: {
    description: "Show a warning against scams.",
    imageSrc: "/assets/block-images/AntiScamDisclaimerBanner.png",
    label: "Anti-scam disclaimer",
    usageText:
      "Comes with a pre-approved text that warns against Government Officials Impersonation Scams.",
  },
  logocloud: {
    description: "Display logos of partner organisations or accolades.",
    imageSrc: "/assets/block-images/LogoCloud.png",
    label: "Logo cloud",
    usageText:
      "Upload original logos with transparent backgrounds for the best results.",
  },
  collectionblock: {
    description: "Automatically display recent items from a Collection.",
    imageSrc: "/assets/block-images/CollectionBlock.png",
    label: "Link a Collection",
    usageText:
      "Keep your website up-to-date with recent items from your newsroom, resources, or blog.",
  },
  imagegallery: {
    description: "Display up to 30 images in a slideshow.",
    imageSrc: "/assets/block-images/ImageGallery.png",
    label: "Image gallery",
    usageText: "Share memorable moments from an event.",
  },
  blockquote: {
    description: "Display a quote or testimonial.",
    imageSrc: "/assets/block-images/Blockquote.png",
    label: "Quote",
    usageText:
      "Humanise your site with powerful quotes or stories from real people.",
  },
  button: {
    description: "Add one or two buttons that link somewhere.",
    imageSrc: "/assets/block-images/Button.png",
    label: "Button",
    usageText:
      "Use when you want to show a clear next step or two, without a heading or coloured background.",
  },
  contactinformation: {
    description: "Display contact information.",
    imageSrc: "/assets/block-images/ContactInformation.png",
    label: "Contact information",
    usageText: "Let people know how they can reach you.",
  },
  dynamiccomponentlist: {
    label: "Dynamic component list",
    description: "Display a list of dynamic components.",
    usageText: "Showcase a list of dynamic components.",
    // TODO: Add imageSrc
  },
  formsg: {
    description: "Embed a form to collect data.",
    imageSrc: "/assets/block-images/FormSG.png",
    label: "FormSG",
    usageText:
      "Get mailing list sign-ups or quick feedback directly on the page.",
  },
} satisfies Record<
  IsomerComponent["type"],
  { label: string; description: string; usageText?: string; imageSrc?: string }
>

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
      "button",
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
      "button",
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
