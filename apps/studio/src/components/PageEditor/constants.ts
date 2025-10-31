import type { IsomerComponent } from "@opengovsg/isomer-components"
import {
  COLLECTION_BLOCK_TYPE,
  CONTACT_INFORMATION_TYPE,
  DEFAULT_CHILDREN_PAGES_BLOCK,
  DYNAMIC_COMPONENT_LIST_TYPE,
  DYNAMIC_DATA_BANNER_TYPE,
  IMAGE_GALLERY_TYPE,
} from "@opengovsg/isomer-components"

const DEFAULT_ALT_TEXT_INPUT = "Describe what the image is about."
const DEFAULT_TITLE_INPUT = "Enter your title here."
const DEFAULT_SUBTITLE_INPUT = "Elaborate on the title here."

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
  childrenpages: DEFAULT_CHILDREN_PAGES_BLOCK,
  accordion: {
    type: "accordion",
    summary: "Enter a descriptive title that makes readers want to expand the accordion.",
    details: {
      type: "prose",
      content: [],
    },
  },
  blockquote: {
    type: "blockquote",
    quote:
      "Enter your quote here.",
    source: "Describe the quote in more detail.",
    imageAlt: DEFAULT_ALT_TEXT_INPUT,
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
              text: "Highlight important notes or key changes here. Keep it to one or two sentences maximum.",
            },
          ],
        },
      ],
    },
  },
  formsg: {
    type: "formsg",
    url: "https://form.gov.sg/686e73c1a1f7bf391ee2b3af",
    title: "A feedback collection form",
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
    alt: DEFAULT_ALT_TEXT_INPUT,
    size: "default",
  },
  infobar: {
    type: "infobar",
    title: DEFAULT_TITLE_INPUT,
    description: DEFAULT_SUBTITLE_INPUT,
  },
  infocards: {
    type: "infocards",
    title: DEFAULT_TITLE_INPUT,
    subtitle: DEFAULT_SUBTITLE_INPUT,
    variant: "cardsWithImages",
    maxColumns: "3",
    cards: [
      {
        title: "Enter your title for the first card here",
        url: "https://www.google.com",
        imageUrl: "/placeholder_no_image.png",
        imageAlt: DEFAULT_ALT_TEXT_INPUT,
        imageFit: "cover",
      },
      {
        title: "Enter your title for the second card here",
        url: "https://www.google.com",
        imageUrl: "/placeholder_no_image.png",
        imageAlt: DEFAULT_ALT_TEXT_INPUT,
        imageFit: "cover",
      },
      {
        title: "Enter your title for the third card here",
        url: "https://www.google.com",
        imageUrl: "/placeholder_no_image.png",
        imageAlt: DEFAULT_ALT_TEXT_INPUT,
        imageFit: "cover",
      },
    ],
  },
  infocols: {
    type: "infocols",
    title: DEFAULT_TITLE_INPUT,
    subtitle: DEFAULT_SUBTITLE_INPUT,
    infoBoxes: [
      {
        title: "Enter your title for the first column here",
        description: DEFAULT_SUBTITLE_INPUT,
        icon: "office-building",
      },
      {
        title: "Enter your title for the second column here",
        description: DEFAULT_SUBTITLE_INPUT,
        icon: "stars",
      },
      {
        title: "Enter your title for the third column here",
        description: DEFAULT_SUBTITLE_INPUT,
        icon: "globe",
      },
    ],
  },
  infopic: {
    type: "infopic",
    title: DEFAULT_TITLE_INPUT,
    description: "Elaborate on the title here. You can add a button too.",
    imageSrc: "/placeholder_no_image.png",
    imageAlt: DEFAULT_ALT_TEXT_INPUT,
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
              text: "Enter content here.",
              type: "text",
            },
          ],
        },
      ],
    },
    imageSrc: "/placeholder_no_image.png",
    imageAlt: DEFAULT_ALT_TEXT_INPUT,
  },
  keystatistics: {
    type: "keystatistics",
    title: DEFAULT_TITLE_INPUT,
    statistics: [
      {
        label: "Feature striking KPIs",
        value: "120 websites",
      },
      {
        label: "Show growth numbers",
        value: "+12.2%",
      },
      {
        label: "Use commas for big numbers",
        value: "12,830",
      },
      {
        label: "Highlight core values",
        value: "Integrity",
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
    title: "Rick Astley's Never Gonna Give You Up",
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
    errorMessage: [
      {
        type: "text",
        text: "Oops! Having trouble loading the data. Try refreshing — that usually does the trick!",
      },
    ],
  },
  logocloud: {
    type: "logocloud",
    images: [],
    title: DEFAULT_TITLE_INPUT,
  },
  [COLLECTION_BLOCK_TYPE]: {
    type: `${COLLECTION_BLOCK_TYPE}`,
    collectionReferenceLink: "", // TODO: placeholder for now as we cannot select a collection beforehand but it's required by the schema
    buttonLabel: "Read all latest news",
    displayThumbnail: true,
    displayCategory: true,
  },
  [IMAGE_GALLERY_TYPE]: {
    type: `${IMAGE_GALLERY_TYPE}`,
    images: [
      {
        caption: "Enter a caption to describe the image or attribute it.",
        src: "/placeholder_no_image.png",
        alt: DEFAULT_ALT_TEXT_INPUT,
      },
      {
        caption: "Enter a caption to describe the image or attribute it.",
        src: "/placeholder_no_image.png",
        alt: DEFAULT_ALT_TEXT_INPUT,
      },
      {
        caption: "Enter a caption to describe the image or attribute it.",
        src: "/placeholder_no_image.png",
        alt: DEFAULT_ALT_TEXT_INPUT,
      },
    ],
  },
  [CONTACT_INFORMATION_TYPE]: {
    type: `${CONTACT_INFORMATION_TYPE}`,
    title: "Contact us",
    methods: [
      {
        method: "email",
        label: "Email",
        values: ["contact@example.com"],
      },
    ],
  },
  [DYNAMIC_COMPONENT_LIST_TYPE]: {
    type: `${DYNAMIC_COMPONENT_LIST_TYPE}`,
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
    description: "Title, summary, hero image, and Call-to-Action",
  },
  childrenpages: {
    label: "Child pages",
    description: "Edit how users see the child page of this folder here",
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
  logocloud: {
    // TODO: Add image source
    label: "Logo cloud",
    description: "Display logos of other agencies here",
    usageText: "Show an overview of related agencies",
  },
  [COLLECTION_BLOCK_TYPE]: {
    // TODO: Add image source
    label: "Collection block",
    description: "Automatically display recent pages from a collection",
    usageText: "Link recent articles from your newsroom, research, or blog.",
    imageSrc: "/assets/block-images/CollectionBlock.png",
  },
  [IMAGE_GALLERY_TYPE]: {
    // TODO: Add image source
    label: "Image gallery",
    description: "Display up to 30 images in a slideshow",
    usageText: "Showcase images from an event.",
  },
  blockquote: {
    label: "Quote",
    description: "Display a quote or testimonial",
    usageText: "Highlight an important quote. You can add an optional image.",
    imageSrc: "/assets/block-images/Blockquote.png",
  },
  [CONTACT_INFORMATION_TYPE]: {
    label: "Contact information",
    description: "Display contact information",
    usageText: "Showcase contact information for your agency.",
    // TODO: Add imageSrc
  },
  [DYNAMIC_COMPONENT_LIST_TYPE]: {
    label: "Dynamic component list",
    description: "Display a list of dynamic components",
    usageText: "Showcase a list of dynamic components.",
    // TODO: Add imageSrc
  },
  formsg: {
    label: "FormSG",
    description: "Embed a form to collect data",
    usageText:
      "Get mailing list sign-ups or quick feedback by embedding a form directly on your page.",
    imageSrc: "/assets/block-images/FormSG.png",
  },
}

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
      IMAGE_GALLERY_TYPE,
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
      IMAGE_GALLERY_TYPE,
    ],
  },
  {
    label: "Add a new section",
    types: ["infocards", "infocols", "keystatistics"],
  },
  { label: "Embed external content", types: ["map", "video", "formsg"] },
]

export const DATABASE_ALLOWED_BLOCKS: AllowedBlockSections =
  CONTENT_ALLOWED_BLOCKS

export const HOMEPAGE_ALLOWED_BLOCKS: AllowedBlockSections = [
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
      COLLECTION_BLOCK_TYPE,
    ],
  },
]
