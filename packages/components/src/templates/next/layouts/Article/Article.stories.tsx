import type { Meta, StoryObj } from "@storybook/react-vite"
import { generateSiteConfig } from "~/stories/helpers"
import type { ArticlePageSchemaType } from "~/types"
import { TAG_CATEGORY_DISPLAY_OPTIONS } from "~/types/constants"

import { ArticleLayout } from "./Article"

const meta: Meta<ArticlePageSchemaType> = {
  argTypes: {},
  component: ArticleLayout,
  parameters: {
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  tags: ["!autodocs"],
  title: "Next/Layouts/Article",
}
export default meta
type Story = StoryObj<typeof ArticleLayout>

const generateArgs = ({
  summary,
}: {
  summary: string
}): ArticlePageSchemaType => (
  {
    content: [
      {
        content: [
          {
            content: [
              {
                text: "Singapore - In a bid to foster community spirit and celebrate the rich tapestry of its diverse population, Singapore is gearing up to host its first-ever Citizens' Festival. This unprecedented event promises to be a dazzling extravaganza filled with entertainment, cultural showcases, and gastronomic delights.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            attrs: {
              id: "section2",
              level: 2,
            },
            content: [
              {
                text: "It does look a bit odd but we can't fix until the typography scale is rejigged",
                type: "text",
              },
            ],
            type: "heading",
          },
          {
            content: [
              {
                text: "One of the highlights of the festival is the Cultural Village, where visitors can immerse themselves in the sights, sounds, and flavors of Singapore's various ethnic communities. From traditional Malay dance performances to Chinese calligraphy demonstrations and Indian culinary workshops, attendees will have the opportunity to gain a deeper appreciation for the country's multicultural heritage.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            content: [
              {
                text: "This is a Chat-GPT4 generated article for visual testing purposes.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "prose",
      },
    ],
    layout: "article",
    page: {
      articlePageHeader: {
        summary,
      },
      category: "Citizen Engagement",
      date: "1 May 2024",
      lastModified: "2024-05-02T14:12:57.160Z",
      permalink:
        "/newsroom/news/man-sentenced-to-24-months-imprisonment-for-smuggling-34-7-kg-of-rhinoceros-horns",
      title:
        "Singapore's Spectacular Citizens' Festival: a Celebration of Unity and Diversity",
    },
    site: generateSiteConfig({
      navbar: {
        items: [
          {
            name: "Home",
            url: "/",
          },
          {
            items: [
              {
                name: "News",
                url: "/newsroom/news",
              },
            ],
            name: "Newsroom",
            url: "/newsroom",
          },
        ],
        utility: {
          items: [
            {
              name: "eServices & Forms",
              url: "/quick-link-1",
            },
            {
              name: "Student Login",
              url: "/quick-link-2",
            },
            {
              name: "Staff Login",
              url: "/quick-link-3",
            },
            {
              name: "Employer Login",
              url: "/quick-link-4",
            },
          ],
        },
      },
      siteMap: {
        children: [
          {
            children: [
              {
                children: [
                  {
                    id: "4",
                    lastModified: "",
                    layout: "content",
                    permalink:
                      "/newsroom/news/man-sentenced-to-24-months-imprisonment-for-smuggling-34-7-kg-of-rhinoceros-horns",
                    summary: "",
                    title:
                      "Man sentenced to 24 months' imprisonment for smuggling 34.7 kg of rhinoceros horns",
                  },
                ],
                id: "3",
                lastModified: "",
                layout: "content",
                permalink: "/newsroom/news",
                summary: "",
                title: "News",
              },
            ],
            id: "2",
            lastModified: "",
            layout: "content",
            permalink: "/newsroom",
            summary: "",
            title: "Newsroom",
          },
        ],
        id: "1",
        lastModified: "",
        layout: "homepage",
        permalink: "/",
        summary: "",
        title: "Home",
      },
    }),
  }
)

export const Default: Story = {
  args: {
    content: [
      {
        alt: "A man is serving food out of a blue food",
        src: "https://images.unsplash.com/photo-1570441262582-a2d4b9a916a5?q=80&w=2948&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        type: "image",
      },
      {
        content: [
          {
            content: [
              {
                text: "Singapore - In a bid to foster community spirit and celebrate the rich tapestry of its diverse population, Singapore is gearing up to host its first-ever Citizens' Festival. This unprecedented event promises to be a dazzling extravaganza filled with entertainment, cultural showcases, and gastronomic delights.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            content: [
              {
                text: "One of the highlights of the festival is the Cultural Village, where visitors can immerse themselves in the sights, sounds, and flavors of Singapore's various ethnic communities. From traditional Malay dance performances to Chinese calligraphy demonstrations and Indian culinary workshops, attendees will have the opportunity to gain a deeper appreciation for the country's multicultural heritage.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            attrs: {
              id: "section1",
              level: 2,
            },
            content: [
              {
                text: "This is a large heading that is meant to be smaller than the title",
                type: "text",
              },
            ],
            type: "heading",
          },
          {
            attrs: {
              id: "section1",
              level: 3,
            },
            content: [{ text: "Testing headings", type: "text" }],
            type: "heading",
          },
          {
            attrs: {
              id: "section1",
              level: 4,
            },
            content: [{ text: "Testing headings", type: "text" }],
            type: "heading",
          },
          {
            content: [{ text: "Your business must have:", type: "text" }],
            type: "paragraph",
          },
          {
            content: [
              {
                text: "This is a Chat-GPT4 generated article for visual testing purposes.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "prose",
      },
      {
        imageAlt: "This is the alt text",
        imageSrc: "https://placehold.co/600x600",
        quote:
          "When I was a rookie, I had trouble overcoming the low rope at first. But when it came to my turn, my buddies knew being there would help spur me to prevail.",
        source:
          "ME2 Jenny Teng, Recipient of SAF Polytechnic Sponsorship, Army Medical Services",
        type: "blockquote",
      },
      {
        description: "This is the description e.g. Established in 1965",
        label: "I can't even help myself",
        methods: [
          {
            label: "Ambassador (Non-Resident)",
            method: "person",
            values: ["Mr John Doe"],
          },
          {
            label: "Chancery",
            method: "address",
            values: [
              "c/o Ministry of Isomer",
              "Lazada One",
              "Singapore 123456",
            ],
          },
          {
            label: "Telephone",
            method: "telephone",
            values: ["+65-12345678 (MFA)"],
          },
          {
            caption: "Recommended to email instead",
            label: "Fax (MFA)",
            method: "fax",
            values: ["+65-64747885"],
          },
          {
            label: "Email",
            method: "email",
            values: ["hello@isomer.gov.sg", "hello-too@isomer.gov.sg"],
          },
          {
            label: "Website",
            method: "website",
            values: [
              "https://www.isomer.gov.sg",
              "https://sample.isomer.gov.sg",
            ],
          },
          {
            caption: "(after hours)",
            label: "In the case of emergency",
            method: "emergency_contact",
            values: ["+65 5678 1234"],
          },
          {
            label: "Operating Hours",
            method: "operating_hours",
            values: ["Mon - Fri", "8.30 am to 5.00 pm", "Sat & Sun - Closed"],
          },
        ],
        otherInformation: {
          label: "Other Information",
          value:
            "For cats and dogs enquiries, please write to this-should-not-by-hyperlinked@isomer.gov.sg. Please note that the Isomer is the <b>bold authority</b> responsible for <a href='https://this-should-not-be-showup.isomer.gov.sg'>cats and dogs matters</a>.",
        },
        title: "This is the title e.g. Office Name 123",
        type: "contactinformation",
        url: "/",
      },
    ],
    layout: "article",
    page: {
      articlePageHeader: {
        summary:
          "Singapore is preparing to host its inaugural Citizens' Festival in Marina Boulevard. The festival aims to unite Singaporeans of all backgrounds through cultural showcases, food markets, live music, and wellness activities.",
      },
      category: "Citizen Engagement",
      date: "1 May 2024",
      lastModified: "2024-05-02T14:12:57.160Z",
      permalink:
        "/newsroom/news/man-sentenced-to-24-months-imprisonment-for-smuggling-34-7-kg-of-rhinoceros-horns",
      title:
        "Singapore's Spectacular Citizens' Festival: a Celebration of Unity and Diversity",
    },
    site: generateSiteConfig({
      navbar: {
        items: [
          {
            name: "Home",
            url: "/",
          },
          {
            items: [
              {
                name: "News",
                url: "/newsroom/news",
              },
            ],
            name: "Newsroom",
            url: "/newsroom",
          },
        ],
        utility: {
          items: [
            {
              name: "eServices & Forms",
              url: "/quick-link-1",
            },
            {
              name: "Student Login",
              url: "/quick-link-2",
            },
            {
              name: "Staff Login",
              url: "/quick-link-3",
            },
            {
              name: "Employer Login",
              url: "/quick-link-4",
            },
          ],
        },
      },
      siteMap: {
        children: [
          {
            children: [
              {
                children: [
                  {
                    id: "4",
                    lastModified: "",
                    layout: "content",
                    permalink:
                      "/newsroom/news/man-sentenced-to-24-months-imprisonment-for-smuggling-34-7-kg-of-rhinoceros-horns",
                    summary: "",
                    title:
                      "Man sentenced to 24 months' imprisonment for smuggling 34.7 kg of rhinoceros horns",
                  },
                ],
                id: "3",
                lastModified: "",
                layout: "content",
                permalink: "/newsroom/news",
                summary: "",
                title: "News",
              },
            ],
            id: "2",
            lastModified: "",
            layout: "content",
            permalink: "/newsroom",
            summary: "",
            title: "Newsroom",
          },
        ],
        id: "1",
        lastModified: "",
        layout: "homepage",
        permalink: "/",
        summary: "",
        title: "Home",
      },
      siteName: "Isomer Next",
    }),
  },
  name: "Article",
}

export const NoImage: Story = {
  args: {
    content: [
      {
        alt: "",
        src: "",
        type: "image",
      },
      {
        content: [
          {
            content: [
              {
                text: "Singapore - In a bid to foster community spirit and celebrate the rich tapestry of its diverse population, Singapore is gearing up to host its first-ever Citizens' Festival. This unprecedented event promises to be a dazzling extravaganza filled with entertainment, cultural showcases, and gastronomic delights.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            content: [
              {
                text: "One of the highlights of the festival is the Cultural Village, where visitors can immerse themselves in the sights, sounds, and flavors of Singapore's various ethnic communities. From traditional Malay dance performances to Chinese calligraphy demonstrations and Indian culinary workshops, attendees will have the opportunity to gain a deeper appreciation for the country's multicultural heritage.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            content: [
              {
                text: "This is a Chat-GPT4 generated article for visual testing purposes.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "prose",
      },
    ],
    layout: "article",
    page: {
      articlePageHeader: {
        summary:
          "Singapore is preparing to host its inaugural Citizens' Festival in Marina Boulevard. The festival aims to unite Singaporeans of all backgrounds through cultural showcases, food markets, live music, and wellness activities.",
      },
      category: "Citizen Engagement",
      date: "1 May 2024",
      lastModified: "2024-05-02T14:12:57.160Z",
      permalink:
        "/newsroom/news/man-sentenced-to-24-months-imprisonment-for-smuggling-34-7-kg-of-rhinoceros-horns",
      title:
        "Singapore's Spectacular Citizens' Festival: a Celebration of Unity and Diversity",
    },
    site: generateSiteConfig({
      siteMap: {
        children: [
          {
            children: [
              {
                children: [
                  {
                    id: "4",
                    lastModified: "",
                    layout: "content",
                    permalink:
                      "/newsroom/news/man-sentenced-to-24-months-imprisonment-for-smuggling-34-7-kg-of-rhinoceros-horns",
                    summary: "",
                    title:
                      "Man sentenced to 24 months' imprisonment for smuggling 34.7 kg of rhinoceros horns",
                  },
                ],
                id: "3",
                lastModified: "",
                layout: "content",
                permalink: "/newsroom/news",
                summary: "",
                title: "News",
              },
            ],
            id: "2",
            lastModified: "",
            layout: "content",
            permalink: "/newsroom",
            summary: "",
            title: "Newsroom",
          },
        ],
        id: "1",
        lastModified: "",
        layout: "homepage",
        permalink: "/",
        summary: "",
        title: "Home",
      },
    }),
  },
  name: "NoImage",
}

export const NoSummary: Story = {
  args: generateArgs({ summary: "" }),
  name: "NoSummary",
}

export const EmptySummary: Story = {
  args: generateArgs({ summary: "   " }),
  name: "EmptySummary",
}

export const TaggedArticle: Story = {
  args: {
    content: [
      {
        alt: "A man is serving food out of a blue food",
        src: "https://images.unsplash.com/photo-1570441262582-a2d4b9a916a5?q=80&w=2948&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        type: "image",
      },
      {
        content: [
          {
            content: [
              {
                text: "Singapore - In a bid to foster community spirit and celebrate the rich tapestry of its diverse population, Singapore is gearing up to host its first-ever Citizens' Festival. This unprecedented event promises to be a dazzling extravaganza filled with entertainment, cultural showcases, and gastronomic delights.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            content: [
              {
                text: "One of the highlights of the festival is the Cultural Village, where visitors can immerse themselves in the sights, sounds, and flavors of Singapore's various ethnic communities. From traditional Malay dance performances to Chinese calligraphy demonstrations and Indian culinary workshops, attendees will have the opportunity to gain a deeper appreciation for the country's multicultural heritage.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            content: [
              {
                text: "This is a Chat-GPT4 generated article for visual testing purposes.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "prose",
      },
    ],
    layout: "article",
    page: {
      articlePageHeader: {
        summary:
          "Singapore is preparing to host its inaugural Citizens' Festival in Marina Boulevard. The festival aims to unite Singaporeans of all backgrounds through cultural showcases, food markets, live music, and wellness activities.",
      },
      category: "Citizen Engagement",
      date: "1 May 2024",
      lastModified: "2024-05-02T14:12:57.160Z",
      permalink:
        "/newsroom/news/man-sentenced-to-24-months-imprisonment-for-smuggling-34-7-kg-of-rhinoceros-horns",
      tags: [
        {
          category: "Tags",
          selected: ["NParks Happenings", "Wild dinosaur"],
        },
        {
          category: "Brand",
          selected: [
            "Daikin",
            "TP Link",
            "Asus",
            "Something slightly longer like this",
            "Something really long like this, a whole essay in a tag, although you should be avoiding this",
          ],
        },
      ],
      title:
        "Singapore's Spectacular Citizens' Festival: a Celebration of Unity and Diversity",
    },
    site: generateSiteConfig({
      siteMap: {
        children: [
          {
            children: [
              {
                children: [
                  {
                    id: "4",
                    lastModified: "",
                    layout: "content",
                    permalink:
                      "/newsroom/news/man-sentenced-to-24-months-imprisonment-for-smuggling-34-7-kg-of-rhinoceros-horns",
                    summary: "",
                    title:
                      "Man sentenced to 24 months' imprisonment for smuggling 34.7 kg of rhinoceros horns",
                  },
                ],
                id: "3",
                lastModified: "",
                layout: "content",
                permalink: "/newsroom/news",
                summary: "",
                title: "News",
              },
            ],
            id: "2",
            lastModified: "",
            layout: "content",
            permalink: "/newsroom",
            summary: "",
            title: "Newsroom",
          },
        ],
        id: "1",
        lastModified: "",
        layout: "homepage",
        permalink: "/",
        summary: "",
        title: "Home",
      },
    }),
  },
  name: "TaggedArticle",
}

const TAGGED_PILLS_OPTION_ID = "tagged-pills-option"
const TAGGED_CATEGORY_OPTION_ID = "tagged-category-option"
const TAGGED_REGION_OPTION_ID = "tagged-region-option"

// Exercises Article.tsx's own derivation of pillTags/plaintextTags from
// `page.tagged` + the parent collection's `tagCategories`, rather than
// hand-feeding ArticlePageHeader with pre-computed props.
export const TaggedArticleWithTagCategories: Story = {
  args: {
    content: [
      {
        alt: "A man is serving food out of a blue food",
        src: "https://images.unsplash.com/photo-1570441262582-a2d4b9a916a5?q=80&w=2948&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        type: "image",
      },
      {
        content: [
          {
            content: [
              {
                text: "This is a Chat-GPT4 generated article for visual testing purposes.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "prose",
      },
    ],
    layout: "article",
    page: {
      title:
        "Singapore's Spectacular Citizens' Festival: a Celebration of Unity and Diversity",
      permalink:
        "/newsroom/news/man-sentenced-to-24-months-imprisonment-for-smuggling-34-7-kg-of-rhinoceros-horns",
      lastModified: "2024-05-02T14:12:57.160Z",
      // NOTE: required by the schema, but ignored at render time since
      // `tagged` + the parent's `tagCategories` take precedence
      category: "Citizen Engagement",
      tagged: [
        TAGGED_PILLS_OPTION_ID,
        TAGGED_CATEGORY_OPTION_ID,
        TAGGED_REGION_OPTION_ID,
      ],
      date: "1 May 2024",
      articlePageHeader: {
        summary:
          "Singapore is preparing to host its inaugural Citizens' Festival in Marina Boulevard. The festival aims to unite Singaporeans of all backgrounds through cultural showcases, food markets, live music, and wellness activities.",
      },
    },
    site: generateSiteConfig({
      siteMap: {
        children: [
          {
            children: [
              {
                children: [
                  {
                    id: "4",
                    lastModified: "",
                    layout: "article",
                    permalink:
                      "/newsroom/news/man-sentenced-to-24-months-imprisonment-for-smuggling-34-7-kg-of-rhinoceros-horns",
                    summary: "",
                    title:
                      "Man sentenced to 24 months' imprisonment for smuggling 34.7 kg of rhinoceros horns",
                  },
                ],
                collectionPagePageProps: {
                  tagCategories: [
                    {
                      display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
                      id: "tags-group",
                      label: "Tags",
                      options: [
                        {
                          id: TAGGED_PILLS_OPTION_ID,
                          label: "NParks Happenings",
                        },
                      ],
                    },
                    {
                      display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
                      id: "category-group",
                      label: "Category",
                      options: [
                        {
                          id: TAGGED_CATEGORY_OPTION_ID,
                          label: "Citizen Engagement",
                        },
                      ],
                    },
                    {
                      display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
                      id: "region-group",
                      label: "Region",
                      options: [
                        { id: TAGGED_REGION_OPTION_ID, label: "Wildlife" },
                      ],
                    },
                  ],
                },
                id: "3",
                lastModified: "",
                layout: "collection",
                permalink: "/newsroom/news",
                summary: "",
                title: "News",
              },
            ],
            id: "2",
            lastModified: "",
            layout: "content",
            permalink: "/newsroom",
            summary: "",
            title: "Newsroom",
          },
        ],
        id: "1",
        lastModified: "",
        layout: "homepage",
        permalink: "/",
        summary: "",
        title: "Home",
      },
    }),
  },
  name: "TaggedArticleWithTagCategories",
}

// Placing this story here as it's due to the overflow-x-auto class on the parent div
export const OrderedList100Items: Story = {
  args: {
    ...generateArgs({ summary: "" }),
    content: [
      {
        content: [
          {
            content: Array.from({ length: 100 }, (_, i) => ({
              content: [
                {
                  content: [{ text: `Item ${i + 1}`, type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "listItem",
            })),
            type: "orderedList",
          },
        ],
        type: "prose",
      },
    ],
  },
  name: "100th Ordered Marker Not Truncated",
}

export const VideoEmbed: Story = {
  args: {
    ...generateArgs({
      summary:
        "Showing how video embeds render within an article page layout, including a vertical Facebook Reel.",
    }),
    content: [
      {
        content: [
          {
            content: [
              {
                text: "Facebook Reels are vertical (9:16) videos. They render in a width-capped portrait box, centred within the article content column, so they are not clipped.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "prose",
      },
      {
        title: "Facebook Reel",
        type: "video",
        url: "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F3028033664054832%2F&show_text=false&width=267&t=0",
      },
    ],
  },
  name: "VideoEmbed",
  parameters: {
    // Delay the Chromatic snapshot so iframes have time to load and don’t appear as white blocks.
    chromatic: { delay: 10_000 },
  },
}
