import type { Meta, StoryObj } from "@storybook/react-vite"
import { http, HttpResponse } from "msw"
import { generateDgsUrl } from "~/hooks/useDgsData/generateDgsUrl"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { ContentLayout } from "./Content"

const meta: Meta<typeof ContentLayout> = {
  argTypes: {},
  component: ContentLayout,
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  tags: ["!autodocs"],
  title: "Next/Layouts/Content",
}
export default meta
type Story = StoryObj<typeof ContentLayout>

export const Default: Story = {
  args: {
    content: [
      {
        content: [
          {
            attrs: {
              id: "section1",
              level: 2,
            },
            content: [
              {
                text: "What does the Irrationality Principle support?",
                type: "text",
              },
            ],
            type: "heading",
          },
        ],
        type: "prose",
      },
      {
        content: {
          content: [
            {
              content: [
                {
                  text: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
                  type: "text",
                },
              ],
              type: "paragraph",
            },
          ],
          type: "prose",
        },
        type: "callout",
      },
      {
        content: [
          {
            content: [
              {
                text: "Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            content: [
              {
                content: [
                  {
                    content: [
                      {
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            content: [
                              {
                                text: "Like this, you might have a list of equipments to bring to the luncheon",
                                type: "text",
                              },
                            ],
                            type: "paragraph",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    content: [
                                      { text: "Luncheon meat", type: "text" },
                                    ],
                                    type: "paragraph",
                                  },
                                ],
                                type: "listItem",
                              },
                              {
                                content: [
                                  {
                                    content: [{ text: "Spam", type: "text" }],
                                    type: "paragraph",
                                  },
                                  {
                                    content: [
                                      {
                                        content: [
                                          {
                                            content: [
                                              {
                                                text: "Another level below",
                                                type: "text",
                                              },
                                            ],
                                            type: "paragraph",
                                          },
                                        ],
                                        type: "listItem",
                                      },
                                      {
                                        content: [
                                          {
                                            content: [
                                              {
                                                text: "This is very deep",
                                                type: "text",
                                              },
                                            ],
                                            type: "paragraph",
                                          },
                                        ],
                                        type: "listItem",
                                      },
                                    ],
                                    type: "unorderedList",
                                  },
                                ],
                                type: "listItem",
                              },
                              {
                                content: [
                                  {
                                    content: [{ text: "hello", type: "text" }],
                                    type: "paragraph",
                                  },
                                ],
                                type: "listItem",
                              },
                            ],
                            type: "unorderedList",
                          },
                        ],
                        type: "listItem",
                      },
                      {
                        content: [
                          {
                            content: [{ text: "Back out again", type: "text" }],
                            type: "paragraph",
                          },
                        ],
                        type: "listItem",
                      },
                    ],
                    type: "unorderedList",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
            ],
            type: "unorderedList",
          },
          {
            attrs: {
              id: "section2",
              level: 2,
            },
            content: [
              { text: "Checklist for sheer irrationality", type: "text" },
            ],
            type: "heading",
          },
          {
            attrs: {
              id: "section1",
              level: 3,
            },
            content: [{ text: "If you are a small business", type: "text" }],
            type: "heading",
          },
          {
            content: [{ text: "Your business must have:", type: "text" }],
            type: "paragraph",
          },
          {
            content: [
              {
                content: [
                  {
                    content: [
                      {
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "(Suitable for those interested in the interdisciplinary study of cognitive science and psychology.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "Practical applications of rationality in daily life are elucidated by Pinker, offering actionable insights for better decision-making. (Beneficial for individuals seeking practical strategies to improve their decision-making processes.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
            ],
            type: "unorderedList",
          },
          {
            attrs: {
              caption: "A table of IIA countries (2024)",
            },
            content: [
              {
                content: [
                  {
                    content: [
                      {
                        content: [{ text: "Countries", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableHeader",
                  },
                  {
                    content: [
                      {
                        content: [
                          { text: "Date of Entry into Force", type: "text" },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "tableHeader",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "IIA Text", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableHeader",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "Some numbers", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableHeader",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "Remarks", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableHeader",
                  },
                ],
                type: "tableRow",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [{ text: "ASEAN", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "2 Aug 1998", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://www.asean.org/asean/asean-agreements-on-investment/'>EN download (3.2 MB)</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "123,456", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                      {
                        content: [
                          {
                            text: "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                      {
                        content: [
                          {
                            content: [
                              {
                                content: [
                                  {
                                    text: "<a href='https://google.com'>AANZFTA</a>",
                                    type: "text",
                                  },
                                ],
                                type: "paragraph",
                              },
                            ],
                            type: "listItem",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    text: "<a href='https://google.com'>ACFTA</a>",
                                    type: "text",
                                  },
                                ],
                                type: "paragraph",
                              },
                            ],
                            type: "listItem",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    text: "<a href='https://google.com'>AKFTA</a>",
                                    type: "text",
                                  },
                                ],
                                type: "paragraph",
                              },
                            ],
                            type: "listItem",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    text: "<a href='https://google.com'>AIFTA</a>",
                                    type: "text",
                                  },
                                ],
                                type: "paragraph",
                              },
                            ],
                            type: "listItem",
                          },
                        ],
                        type: "unorderedList",
                      },
                    ],
                    type: "tableCell",
                  },
                ],
                type: "tableRow",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [{ text: "Bahrain", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "8 Dec 2004", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "123,456", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                      {
                        content: [
                          {
                            text: "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                      {
                        content: [
                          {
                            content: [
                              {
                                content: [
                                  {
                                    text: "<a href='https://google.com'>AANZFTA</a>",
                                    type: "text",
                                  },
                                ],
                                type: "paragraph",
                              },
                            ],
                            type: "listItem",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    text: "<a href='https://google.com'>ACFTA</a>",
                                    type: "text",
                                  },
                                ],
                                type: "paragraph",
                              },
                            ],
                            type: "listItem",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    text: "<a href='https://google.com'>AKFTA</a>",
                                    type: "text",
                                  },
                                ],
                                type: "paragraph",
                              },
                            ],
                            type: "listItem",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    text: "<a href='https://google.com'>AIFTA</a>",
                                    type: "text",
                                  },
                                ],
                                type: "paragraph",
                              },
                            ],
                            type: "listItem",
                          },
                        ],
                        type: "orderedList",
                      },
                    ],
                    type: "tableCell",
                  },
                ],
                type: "tableRow",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [{ text: "Bangladesh", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "19 Nov 2004", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "123,456", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "Some text", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                ],
                type: "tableRow",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [{ text: "Belarus", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "13 Jan 2001", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "123,456", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                ],
                type: "tableRow",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [
                          { text: "Belgium and Luxembourg", type: "text" },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "27 Nov 1980", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "123,456", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                ],
                type: "tableRow",
              },
            ],
            type: "table",
          },
          {
            content: [
              {
                content: [
                  {
                    content: [
                      {
                        text: "List item directly below a table",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      { text: "Second item to show the rhythm", type: "text" },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
            ],
            type: "unorderedList",
          },
          {
            content: [{ text: "This is yet another paragraph", type: "text" }],
            type: "paragraph",
          },
          {
            attrs: {
              id: "section3",
              level: 4,
            },
            content: [{ text: "But then, if you are listed", type: "text" }],
            type: "heading",
          },
          {
            content: [
              {
                text: "In the realm of human cognition, irrationality often reigns supreme, defying the logic that ostensibly governs our decisions and actions. It manifests in myriad ways, from the subtle biases that influence our perceptions to the outright contradictions that confound our rational minds. We find ourselves ensnared in cognitive dissonance, grappling with conflicting beliefs and emotions that lead us astray from the path of reason. Despite our best intentions, we succumb to the allure of irrationality, surrendering to the whims of impulse and emotion. Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "prose",
      },
      {
        alt: "Two rhinos. A rhino is peacefully grazing on grass in a field in front of the other rhino.",
        caption: "An image directly followed by a list",
        src: "https://images.unsplash.com/photo-1527436826045-8805c615a6df?w=1280",
        type: "image",
      },
      {
        content: [
          {
            content: [
              {
                content: [
                  {
                    content: [
                      {
                        text: "List item directly below an image",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      { text: "Second item to show the rhythm", type: "text" },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
            ],
            type: "unorderedList",
          },
        ],
        type: "prose",
      },
      {
        details: {
          content: [
            {
              content: [{ text: "this is the first item", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "prose",
        },
        summary: "First title for an accordion item",
        type: "accordion",
      },
      {
        details: {
          content: [
            {
              content: [{ text: "this is the second item", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "prose",
        },
        summary: "Second title for the accordion item",
        type: "accordion",
      },
      {
        content: {
          content: [
            {
              content: [
                {
                  marks: [
                    {
                      type: "bold",
                    },
                  ],
                  text: "Professor Rhino Bean",
                  type: "text",
                },
                { type: "hardBreak" },
                {
                  marks: [
                    {
                      type: "bold",
                    },
                  ],
                  text: "Executive Bean",
                  type: "text",
                },
              ],
              type: "paragraph",
            },
            {
              content: [
                {
                  marks: [],
                  text: "Rhinos are large, sturdy mammals known for their thick, protective skin and one or two horns on their snouts. They inhabit parts of Africa and Asia and are primarily herbivores, feeding on grasses, leaves, and shoots. Despite their imposing size and strength, rhinos are endangered due to habitat loss and poaching. Conservation efforts are crucial to ensuring their survival.",
                  type: "text",
                },
              ],
              type: "paragraph",
            },
            {
              content: [
                {
                  content: [
                    {
                      content: [
                        {
                          marks: [
                            {
                              type: "bold",
                            },
                          ],
                          text: "Impressive Size and Strength: ",
                          type: "text",
                        },
                        {
                          text: "Rhinos are among the largest land mammals, with powerful builds that make them formidable in the wild.",
                          type: "text",
                        },
                      ],
                      type: "paragraph",
                    },
                  ],
                  type: "listItem",
                },
                {
                  content: [
                    {
                      content: [
                        {
                          marks: [
                            {
                              type: "bold",
                            },
                          ],
                          text: "Unique Horns: ",
                          type: "text",
                        },
                        {
                          text: "Their distinctive horns are not only a symbol of their strength but also serve important roles in defense and foraging.",
                          type: "text",
                        },
                      ],
                      type: "paragraph",
                    },
                  ],
                  type: "listItem",
                },
                {
                  content: [
                    {
                      content: [
                        {
                          marks: [
                            {
                              type: "bold",
                            },
                          ],
                          text: "Ancient Survivors: ",
                          type: "text",
                        },
                        {
                          text: "Rhinos have been around for millions of years, representing a living link to prehistoric times.",
                          type: "text",
                        },
                      ],
                      type: "paragraph",
                    },
                  ],
                  type: "listItem",
                },
                {
                  content: [
                    {
                      content: [
                        {
                          marks: [
                            {
                              type: "bold",
                            },
                          ],
                          text: "Ecological Impact: ",
                          type: "text",
                        },
                        {
                          text: "Rhinos play a key role in their ecosystems by helping to maintain the balance of vegetation and supporting other wildlife.",
                          type: "text",
                        },
                      ],
                      type: "paragraph",
                    },
                  ],
                  type: "listItem",
                },
              ],
              type: "unorderedList",
            },
            {
              content: [
                {
                  marks: [],
                  text: "<a href='https://www.traffic.org/news/singapore-rhino-horn-smuggler-24/'>Singapore court gets tough on rhino horn smuggler</a>",
                  type: "text",
                },
              ],
              type: "paragraph",
            },
          ],
          type: "prose",
        },
        imageAlt:
          "Two rhinos. A rhino is peacefully grazing on grass in a field in front of the other rhino.",
        imageSrc:
          "https://images.unsplash.com/photo-1527436826045-8805c615a6df?w=1280",
        type: "contentpic",
      },
      {
        buttonLabel: "Primary CTA",
        buttonUrl: "/",
        description: "About a sentence worth of description here",
        secondaryButtonLabel: "Secondary CTA",
        secondaryButtonUrl: "/",
        title: "This is a place where you can put nice content",
        type: "infobar",
      },
      {
        cards: [
          {
            description:
              "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
            imageAlt: "alt text",
            imageUrl: "https://placehold.co/200x300",
            title: "A yummy, tipsy evening at Duxton",
            url: "https://www.google.com",
          },
          {
            description:
              "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
            imageAlt: "alt text",
            imageUrl: "https://placehold.co/200x300",
            title: "A yummy, tipsy evening at Duxton",
            url: "https://www.google.com",
          },
          {
            imageAlt: "alt text",
            imageUrl: "https://placehold.co/200x300",
            title: "A yummy, tipsy evening at Duxton",
            url: "https://www.google.com",
          },
          {
            imageAlt: "alt text",
            imageUrl: "https://placehold.co/200x300",
            title: "A yummy, tipsy evening at Duxton",
            url: "https://www.google.com",
          },
        ],
        maxColumns: "3",
        subtitle:
          "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
        title:
          "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
        type: "infocards",
        variant: "cardsWithImages",
      },
      {
        infoBoxes: [
          {
            buttonLabel: "Read article",
            buttonUrl: "/faq",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            icon: "bar-chart",
            title: "Committee of Supply (COS) 2023",
          },
          {
            buttonLabel: "Read article",
            buttonUrl: "https://google.com",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            icon: "bar-chart",
            title: "Committee of Supply (COS) 2023",
          },
          {
            buttonLabel: "Read article",
            buttonUrl: "/faq",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            icon: "bar-chart",
            title: "Committee of Supply (COS) 2023",
          },
          {
            buttonLabel: "Read article",
            buttonUrl: "https://google.com",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            icon: "bar-chart",
            title: "Committee of Supply (COS) 2023",
          },
          {
            buttonLabel: "Read article",
            buttonUrl: "/faq",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            icon: "bar-chart",
            title: "Committee of Supply (COS) 2023",
          },
          {
            buttonLabel: "Read article",
            buttonUrl: "https://google.com",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            icon: "bar-chart",
            title: "Committee of Supply (COS) 2023",
          },
        ],
        subtitle: "Some of the things that we are working on",
        title: "Highlights",
        type: "infocols",
      },
      {
        statistics: [
          {
            label: "Advance GDP Estimates, 4Q 2023 (YoY)",
            value: "+2.8%",
          },
          { label: "Total Merchandise Trade, Dec 2023 (YoY)", value: "-6.8%" },
          { label: "Industrial Production, Dec 2023 (YoY)", value: "-2.5%" },
        ],
        title: "Key economic indicators",
        type: "keystatistics",
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
        images: [
          {
            alt: "Image 1",
            caption: "You're so cute, I want to boop your little nose.",
            src: "https://images.unsplash.com/photo-1688420622107-9e7c9aefd30c?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          },
          {
            alt: "Image 2",
            caption: "I hate hairballs, but you're my favorite furball.",
            src: "https://images.unsplash.com/photo-1621961095257-eb44404a4dd0?q=80&w=2267&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          },
          {
            alt: "Image 3",
            caption: "Let's curl up to shoegaze until we fall asleep.",
            src: "https://images.unsplash.com/photo-1496285138399-b5d7d20d1e16?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          },
          {
            alt: "Image 4",
            caption: "You asked if I love you? I said 1 2 3 4ever... meow.",
            src: "https://plus.unsplash.com/premium_photo-1736437252009-634e1b2a41a0?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          },
          {
            alt: "Image 5",
            caption: "If curiosity were water, I'd be the entire fish tank.",
            src: "https://images.unsplash.com/photo-1628406639294-5b87bae55f7c?q=80&w=3730&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          },
          {
            alt: "Image 6",
            caption: "I can't do anything now that the laser pointer's gone.",
            src: "https://images.unsplash.com/photo-1577199732177-90d51f8e8601?q=80&w=3687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          },
          {
            alt: "Image 7",
            caption: "You're a bird I can't catch.",
            src: "https://images.unsplash.com/photo-1632748635837-b0ff1acf5596?q=80&w=3136&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          },
          {
            alt: "Image 8",
            caption: "You nap on my keyboard rent-free.",
            src: "https://images.unsplash.com/photo-1694375073673-fc3f0b706d8c?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          },
          {
            alt: "Image 9",
            caption: "This house needs more catnip.",
            src: "https://images.unsplash.com/photo-1742459396394-4bad6dcf0e0e?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          },
          {
            alt: "Image 10",
            caption: "Climbing curtains like we did when we were kittens.",
            src: "https://images.unsplash.com/photo-1549141022-6b68900e53af?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          },
        ],
        type: "imagegallery",
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
      {
        title: "This is the video",
        type: "video",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ],
    layout: "content",
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      contentPageHeader: {
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
        showThumbnail: false,
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
      },
      lastModified: "2024-05-02T14:12:57.160Z",
      permalink: "/parent/rationality",
      title:
        "Irrationality this should have a long long long long long long long title that wraps to the max width of the content header, and its' breadcrumb truncates, but ideally should not be this long",
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
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "5",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "3",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality",
                summary: "",
                title:
                  "Irrationality this should have a long long long long long long long title that wraps to the max width of the content header, and its' breadcrumb truncates, but ideally should not be this long",
              },
              {
                children: [
                  {
                    id: "7",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "6",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title:
                  "Sibling with a long title that will likely cause an overflow",
              },
              {
                children: [
                  {
                    id: "9",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "10",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "8",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality2",
                summary: "",
                title:
                  "IrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationality",
              },
              {
                children: [
                  {
                    id: "12",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "11",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title: "Sibling",
              },
              {
                children: [
                  {
                    id: "14",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "15",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "13",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality3",
                summary: "",
                title: "Irrationality3",
              },
              {
                children: [
                  {
                    id: "17",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "16",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title: "Sibling",
              },
              {
                children: [
                  {
                    id: "19",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "20",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "18",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality4",
                summary: "",
                title: "Irrationality4",
              },
              {
                children: [
                  {
                    id: "22",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "21",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title: "Sibling",
              },
              {
                children: [
                  {
                    id: "24",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "25",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "23",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality5",
                summary: "",
                title: "Irrationality5",
              },
              {
                children: [
                  {
                    id: "27",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "26",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title: "Sibling",
              },
              {
                children: [
                  {
                    id: "29",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "30",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "28",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality6",
                summary: "",
                title: "Irrationality6",
              },
              {
                children: [
                  {
                    id: "32",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "31",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title: "Sibling",
              },
            ],
            id: "2",
            lastModified: "",
            layout: "content",
            permalink: "/parent",
            summary: "",
            title:
              "Parent page with a very long title that will likely cause an overflow",
          },
          {
            id: "33",
            lastModified: "",
            layout: "content",
            permalink: "/aunt-uncle",
            summary: "",
            title: "Aunt/Uncle that should not appear",
          },
        ],
        id: "1",
        lastModified: "",
        layout: "homepage",
        permalink: "/",
        summary: "",
        title: "Isomer Next",
      },
    }),
  },
}

export const Image: Story = {
  args: {
    content: [
      {
        content: [
          {
            attrs: {
              id: "section1",
              level: 2,
            },
            content: [
              {
                text: "What does the Irrationality Principle support?",
                type: "text",
              },
            ],
            type: "heading",
          },
        ],
        type: "prose",
      },
      {
        content: {
          content: [
            {
              content: [
                {
                  text: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
                  type: "text",
                },
              ],
              type: "paragraph",
            },
          ],
          type: "prose",
        },
        type: "callout",
      },
      {
        content: [
          {
            content: [
              {
                text: "Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            content: [
              {
                content: [
                  {
                    content: [
                      {
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            content: [
                              {
                                text: "Like this, you might have a list of equipments to bring to the luncheon",
                                type: "text",
                              },
                            ],
                            type: "paragraph",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    content: [
                                      { text: "Luncheon meat", type: "text" },
                                    ],
                                    type: "paragraph",
                                  },
                                ],
                                type: "listItem",
                              },
                              {
                                content: [
                                  {
                                    content: [{ text: "Spam", type: "text" }],
                                    type: "paragraph",
                                  },
                                  {
                                    content: [
                                      {
                                        content: [
                                          {
                                            content: [
                                              {
                                                text: "Another level below",
                                                type: "text",
                                              },
                                            ],
                                            type: "paragraph",
                                          },
                                        ],
                                        type: "listItem",
                                      },
                                      {
                                        content: [
                                          {
                                            content: [
                                              {
                                                text: "This is very deep",
                                                type: "text",
                                              },
                                            ],
                                            type: "paragraph",
                                          },
                                        ],
                                        type: "listItem",
                                      },
                                    ],
                                    type: "unorderedList",
                                  },
                                ],
                                type: "listItem",
                              },
                              {
                                content: [
                                  {
                                    content: [{ text: "hello", type: "text" }],
                                    type: "paragraph",
                                  },
                                ],
                                type: "listItem",
                              },
                            ],
                            type: "unorderedList",
                          },
                        ],
                        type: "listItem",
                      },
                      {
                        content: [
                          {
                            content: [{ text: "Back out again", type: "text" }],
                            type: "paragraph",
                          },
                        ],
                        type: "listItem",
                      },
                    ],
                    type: "unorderedList",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
            ],
            type: "unorderedList",
          },
          {
            attrs: {
              id: "section2",
              level: 2,
            },
            content: [
              { text: "Checklist for sheer irrationality", type: "text" },
            ],
            type: "heading",
          },
          {
            attrs: {
              id: "section1",
              level: 3,
            },
            content: [{ text: "If you are a small business", type: "text" }],
            type: "heading",
          },
          {
            content: [{ text: "Your business must have:", type: "text" }],
            type: "paragraph",
          },
          {
            content: [
              {
                content: [
                  {
                    content: [
                      {
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "(Suitable for those interested in the interdisciplinary study of cognitive science and psychology.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "Practical applications of rationality in daily life are elucidated by Pinker, offering actionable insights for better decision-making. (Beneficial for individuals seeking practical strategies to improve their decision-making processes.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
            ],
            type: "unorderedList",
          },
          {
            attrs: {
              caption: "A table of IIA countries (2024)",
            },
            content: [
              {
                content: [
                  {
                    content: [
                      {
                        content: [{ text: "Countries", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableHeader",
                  },
                  {
                    content: [
                      {
                        content: [
                          { text: "Date of Entry into Force", type: "text" },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "tableHeader",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "IIA Text", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableHeader",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "Some numbers", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableHeader",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "Remarks", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableHeader",
                  },
                ],
                type: "tableRow",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [{ text: "ASEAN", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "2 Aug 1998", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://www.asean.org/asean/asean-agreements-on-investment/'>EN download (3.2 MB)</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "123,456", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                      {
                        content: [
                          {
                            text: "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                      {
                        content: [
                          {
                            content: [
                              {
                                content: [
                                  {
                                    text: "<a href='https://google.com'>AANZFTA</a>",
                                    type: "text",
                                  },
                                ],
                                type: "paragraph",
                              },
                            ],
                            type: "listItem",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    text: "<a href='https://google.com'>ACFTA</a>",
                                    type: "text",
                                  },
                                ],
                                type: "paragraph",
                              },
                            ],
                            type: "listItem",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    text: "<a href='https://google.com'>AKFTA</a>",
                                    type: "text",
                                  },
                                ],
                                type: "paragraph",
                              },
                            ],
                            type: "listItem",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    text: "<a href='https://google.com'>AIFTA</a>",
                                    type: "text",
                                  },
                                ],
                                type: "paragraph",
                              },
                            ],
                            type: "listItem",
                          },
                        ],
                        type: "unorderedList",
                      },
                    ],
                    type: "tableCell",
                  },
                ],
                type: "tableRow",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [{ text: "Bahrain", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "8 Dec 2004", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "123,456", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                      {
                        content: [
                          {
                            text: "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                      {
                        content: [
                          {
                            content: [
                              {
                                content: [
                                  {
                                    text: "<a href='https://google.com'>AANZFTA</a>",
                                    type: "text",
                                  },
                                ],
                                type: "paragraph",
                              },
                            ],
                            type: "listItem",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    text: "<a href='https://google.com'>ACFTA</a>",
                                    type: "text",
                                  },
                                ],
                                type: "paragraph",
                              },
                            ],
                            type: "listItem",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    text: "<a href='https://google.com'>AKFTA</a>",
                                    type: "text",
                                  },
                                ],
                                type: "paragraph",
                              },
                            ],
                            type: "listItem",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    text: "<a href='https://google.com'>AIFTA</a>",
                                    type: "text",
                                  },
                                ],
                                type: "paragraph",
                              },
                            ],
                            type: "listItem",
                          },
                        ],
                        type: "orderedList",
                      },
                    ],
                    type: "tableCell",
                  },
                ],
                type: "tableRow",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [{ text: "Bangladesh", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "19 Nov 2004", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "123,456", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "Some text", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                ],
                type: "tableRow",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [{ text: "Belarus", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "13 Jan 2001", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "123,456", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                ],
                type: "tableRow",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [
                          { text: "Belgium and Luxembourg", type: "text" },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "27 Nov 1980", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "123,456", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                ],
                type: "tableRow",
              },
            ],
            type: "table",
          },
          {
            content: [{ text: "This is yet another paragraph", type: "text" }],
            type: "paragraph",
          },
          {
            attrs: {
              id: "section3",
              level: 4,
            },
            content: [{ text: "But then, if you are listed", type: "text" }],
            type: "heading",
          },
          {
            content: [
              {
                text: "In the realm of human cognition, irrationality often reigns supreme, defying the logic that ostensibly governs our decisions and actions. It manifests in myriad ways, from the subtle biases that influence our perceptions to the outright contradictions that confound our rational minds. We find ourselves ensnared in cognitive dissonance, grappling with conflicting beliefs and emotions that lead us astray from the path of reason. Despite our best intentions, we succumb to the allure of irrationality, surrendering to the whims of impulse and emotion. Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "prose",
      },
      {
        details: {
          content: [
            {
              content: [{ text: "this is the first item", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "prose",
        },
        summary: "First title for an accordion item",
        type: "accordion",
      },
      {
        details: {
          content: [
            {
              content: [{ text: "this is the second item", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "prose",
        },
        summary: "Second title for the accordion item",
        type: "accordion",
      },
      {
        content: {
          content: [
            {
              content: [
                {
                  marks: [
                    {
                      type: "bold",
                    },
                  ],
                  text: "Professor Rhino Bean",
                  type: "text",
                },
                { type: "hardBreak" },
                {
                  marks: [
                    {
                      type: "bold",
                    },
                  ],
                  text: "Executive Bean",
                  type: "text",
                },
              ],
              type: "paragraph",
            },
            {
              content: [
                {
                  marks: [],
                  text: "Rhinos are large, sturdy mammals known for their thick, protective skin and one or two horns on their snouts. They inhabit parts of Africa and Asia and are primarily herbivores, feeding on grasses, leaves, and shoots. Despite their imposing size and strength, rhinos are endangered due to habitat loss and poaching. Conservation efforts are crucial to ensuring their survival.",
                  type: "text",
                },
              ],
              type: "paragraph",
            },
            {
              content: [
                {
                  content: [
                    {
                      content: [
                        {
                          marks: [
                            {
                              type: "bold",
                            },
                          ],
                          text: "Impressive Size and Strength: ",
                          type: "text",
                        },
                        {
                          text: "Rhinos are among the largest land mammals, with powerful builds that make them formidable in the wild.",
                          type: "text",
                        },
                      ],
                      type: "paragraph",
                    },
                  ],
                  type: "listItem",
                },
                {
                  content: [
                    {
                      content: [
                        {
                          marks: [
                            {
                              type: "bold",
                            },
                          ],
                          text: "Unique Horns: ",
                          type: "text",
                        },
                        {
                          text: "Their distinctive horns are not only a symbol of their strength but also serve important roles in defense and foraging.",
                          type: "text",
                        },
                      ],
                      type: "paragraph",
                    },
                  ],
                  type: "listItem",
                },
                {
                  content: [
                    {
                      content: [
                        {
                          marks: [
                            {
                              type: "bold",
                            },
                          ],
                          text: "Ancient Survivors: ",
                          type: "text",
                        },
                        {
                          text: "Rhinos have been around for millions of years, representing a living link to prehistoric times.",
                          type: "text",
                        },
                      ],
                      type: "paragraph",
                    },
                  ],
                  type: "listItem",
                },
                {
                  content: [
                    {
                      content: [
                        {
                          marks: [
                            {
                              type: "bold",
                            },
                          ],
                          text: "Ecological Impact: ",
                          type: "text",
                        },
                        {
                          text: "Rhinos play a key role in their ecosystems by helping to maintain the balance of vegetation and supporting other wildlife.",
                          type: "text",
                        },
                      ],
                      type: "paragraph",
                    },
                  ],
                  type: "listItem",
                },
              ],
              type: "unorderedList",
            },
            {
              content: [
                {
                  marks: [],
                  text: "<a href='https://www.traffic.org/news/singapore-rhino-horn-smuggler-24/'>Singapore court gets tough on rhino horn smuggler</a>",
                  type: "text",
                },
              ],
              type: "paragraph",
            },
          ],
          type: "prose",
        },
        imageAlt:
          "Two rhinos. A rhino is peacefully grazing on grass in a field in front of the other rhino.",
        imageSrc:
          "https://images.unsplash.com/photo-1527436826045-8805c615a6df?w=1280",
        type: "contentpic",
      },
      {
        buttonLabel: "Primary CTA",
        buttonUrl: "/",
        description: "About a sentence worth of description here",
        secondaryButtonLabel: "Secondary CTA",
        secondaryButtonUrl: "/",
        title: "This is a place where you can put nice content",
        type: "infobar",
      },
      {
        title: "Post ICT Survey",
        type: "formsg",
        url: "https://form.gov.sg/6041e9f8bd47260012395250",
      },
      {
        cards: [
          {
            description:
              "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
            imageAlt: "alt text",
            imageUrl: "https://placehold.co/200x300",
            title: "A yummy, tipsy evening at Duxton",
            url: "https://www.google.com",
          },
          {
            description:
              "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
            imageAlt: "alt text",
            imageUrl: "https://placehold.co/200x300",
            title: "A yummy, tipsy evening at Duxton",
            url: "https://www.google.com",
          },
          {
            imageAlt: "alt text",
            imageUrl: "https://placehold.co/200x300",
            title: "A yummy, tipsy evening at Duxton",
            url: "https://www.google.com",
          },
          {
            imageAlt: "alt text",
            imageUrl: "https://placehold.co/200x300",
            title: "A yummy, tipsy evening at Duxton",
            url: "https://www.google.com",
          },
        ],
        maxColumns: "3",
        subtitle:
          "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
        title:
          "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
        type: "infocards",
        variant: "cardsWithImages",
      },
      {
        infoBoxes: [
          {
            buttonLabel: "Read article",
            buttonUrl: "/faq",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            icon: "bar-chart",
            title: "Committee of Supply (COS) 2023",
          },
          {
            buttonLabel: "Read article",
            buttonUrl: "https://google.com",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            icon: "bar-chart",
            title: "Committee of Supply (COS) 2023",
          },
          {
            buttonLabel: "Read article",
            buttonUrl: "/faq",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            icon: "bar-chart",
            title: "Committee of Supply (COS) 2023",
          },
          {
            buttonLabel: "Read article",
            buttonUrl: "https://google.com",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            icon: "bar-chart",
            title: "Committee of Supply (COS) 2023",
          },
          {
            buttonLabel: "Read article",
            buttonUrl: "/faq",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            icon: "bar-chart",
            title: "Committee of Supply (COS) 2023",
          },
          {
            buttonLabel: "Read article",
            buttonUrl: "https://google.com",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            icon: "bar-chart",
            title: "Committee of Supply (COS) 2023",
          },
        ],
        subtitle: "Some of the things that we are working on",
        title: "Highlights",
        type: "infocols",
      },
      {
        statistics: [
          {
            label: "Advance GDP Estimates, 4Q 2023 (YoY)",
            value: "+2.8%",
          },
          { label: "Total Merchandise Trade, Dec 2023 (YoY)", value: "-6.8%" },
          { label: "Industrial Production, Dec 2023 (YoY)", value: "-2.5%" },
        ],
        title: "Key economic indicators",
        type: "keystatistics",
      },
    ],
    layout: "content",
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      contentPageHeader: {
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
        showThumbnail: true,
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
      },
      image: {
        alt: "Sunflower ket ",
        src: "https://plus.unsplash.com/premium_photo-1677545183884-421157b2da02?q=80&w=3272&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
      lastModified: "2024-05-02T14:12:57.160Z",
      permalink: "/parent/rationality",
      title:
        "Irrationality this should have a long long long long long long long title that wraps to the max width of the content header, and its' breadcrumb truncates, but ideally should not be this long",
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
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "5",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "3",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality",
                summary: "",
                title:
                  "Irrationality this should have a long long long long long long long title that wraps to the max width of the content header, and its' breadcrumb truncates, but ideally should not be this long",
              },
              {
                children: [
                  {
                    id: "7",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "6",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title:
                  "Sibling with a long title that will likely cause an overflow",
              },
              {
                children: [
                  {
                    id: "9",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "10",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "8",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality2",
                summary: "",
                title:
                  "IrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationality",
              },
              {
                children: [
                  {
                    id: "12",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "11",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title: "Sibling",
              },
              {
                children: [
                  {
                    id: "14",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "15",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "13",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality3",
                summary: "",
                title: "Irrationality3",
              },
              {
                children: [
                  {
                    id: "17",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "16",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title: "Sibling",
              },
              {
                children: [
                  {
                    id: "19",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "20",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "18",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality4",
                summary: "",
                title: "Irrationality4",
              },
              {
                children: [
                  {
                    id: "22",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "21",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title: "Sibling",
              },
              {
                children: [
                  {
                    id: "24",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "25",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "23",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality5",
                summary: "",
                title: "Irrationality5",
              },
              {
                children: [
                  {
                    id: "27",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "26",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title: "Sibling",
              },
              {
                children: [
                  {
                    id: "29",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "30",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "28",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality6",
                summary: "",
                title: "Irrationality6",
              },
              {
                children: [
                  {
                    id: "32",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "31",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title: "Sibling",
              },
            ],
            id: "2",
            lastModified: "",
            layout: "content",
            permalink: "/parent",
            summary: "",
            title:
              "Parent page with a very long title that will likely cause an overflow",
          },
          {
            id: "33",
            lastModified: "",
            layout: "content",
            permalink: "/aunt-uncle",
            summary: "",
            title: "Aunt/Uncle that should not appear",
          },
        ],
        id: "1",
        lastModified: "",
        layout: "homepage",
        permalink: "/",
        summary: "",
        title: "Isomer Next",
      },
    }),
  },
}

export const NoTable: Story = {
  args: {
    content: [
      {
        content: [
          {
            attrs: {
              id: "section1",
              level: 2,
            },
            content: [
              {
                text: "What does the Irrationality Principle support?",
                type: "text",
              },
            ],
            type: "heading",
          },
        ],
        type: "prose",
      },
      {
        content: {
          content: [
            {
              content: [
                {
                  text: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
                  type: "text",
                },
              ],
              type: "paragraph",
            },
          ],
          type: "prose",
        },
        type: "callout",
      },

      {
        title: "Public AED locations",
        type: "map",
        url: "https://maps.gov.sg/scdf-aed",
      },
      {
        content: [
          {
            content: [
              {
                text: "Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            content: [
              {
                content: [
                  {
                    content: [
                      {
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            content: [
                              {
                                text: "Like this, you might have a list of equipments to bring to the luncheon",
                                type: "text",
                              },
                            ],
                            type: "paragraph",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    content: [
                                      { text: "Luncheon meat", type: "text" },
                                    ],
                                    type: "paragraph",
                                  },
                                ],
                                type: "listItem",
                              },
                              {
                                content: [
                                  {
                                    content: [{ text: "Spam", type: "text" }],
                                    type: "paragraph",
                                  },
                                  {
                                    content: [
                                      {
                                        content: [
                                          {
                                            content: [
                                              {
                                                text: "Another level below",
                                                type: "text",
                                              },
                                            ],
                                            type: "paragraph",
                                          },
                                        ],
                                        type: "listItem",
                                      },
                                      {
                                        content: [
                                          {
                                            content: [
                                              {
                                                text: "This is very deep",
                                                type: "text",
                                              },
                                            ],
                                            type: "paragraph",
                                          },
                                        ],
                                        type: "listItem",
                                      },
                                    ],
                                    type: "unorderedList",
                                  },
                                ],
                                type: "listItem",
                              },
                              {
                                content: [
                                  {
                                    content: [{ text: "hello", type: "text" }],
                                    type: "paragraph",
                                  },
                                ],
                                type: "listItem",
                              },
                            ],
                            type: "unorderedList",
                          },
                        ],
                        type: "listItem",
                      },
                      {
                        content: [
                          {
                            content: [{ text: "Back out again", type: "text" }],
                            type: "paragraph",
                          },
                        ],
                        type: "listItem",
                      },
                    ],
                    type: "unorderedList",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
            ],
            type: "unorderedList",
          },
          {
            attrs: {
              id: "section2",
              level: 2,
            },
            content: [
              { text: "Checklist for sheer irrationality", type: "text" },
            ],
            type: "heading",
          },
          {
            attrs: {
              id: "section1",
              level: 3,
            },
            content: [{ text: "If you are a small business", type: "text" }],
            type: "heading",
          },
          {
            content: [{ text: "Your business must have:", type: "text" }],
            type: "paragraph",
          },
          {
            content: [
              {
                content: [
                  {
                    content: [
                      {
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "(Suitable for those interested in the interdisciplinary study of cognitive science and psychology.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "Practical applications of rationality in daily life are elucidated by Pinker, offering actionable insights for better decision-making. (Beneficial for individuals seeking practical strategies to improve their decision-making processes.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
            ],
            type: "unorderedList",
          },
          {
            content: [
              {
                marks: [
                  {
                    attrs: {
                      href: "[resource:1:8]",
                    },
                    type: "link",
                  },
                ],
                text: "This is yet another paragraph",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            attrs: {
              id: "section3",
              level: 4,
            },
            content: [{ text: "But then, if you are listed", type: "text" }],
            type: "heading",
          },
          {
            content: [
              {
                text: "In the realm of human cognition, irrationality often reigns supreme, defying the logic that ostensibly governs our decisions and actions. It manifests in myriad ways, from the subtle biases that influence our perceptions to the outright contradictions that confound our rational minds. We find ourselves ensnared in cognitive dissonance, grappling with conflicting beliefs and emotions that lead us astray from the path of reason. Despite our best intentions, we succumb to the allure of irrationality, surrendering to the whims of impulse and emotion. Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "prose",
      },
      {
        title: "Error map",
        type: "map",
        url: "https://maps.gov.sg/this-map-should-not-exist!",
      },
      {
        alt: "alt",
        caption: "A caption",
        size: "smaller",
        src: "/placeholder_no_image.png",
        type: "image",
      },
    ],
    layout: "content",
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      contentPageHeader: {
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
        showThumbnail: false,
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
      },
      lastModified: "2024-05-02T14:12:57.160Z",
      permalink: "/parent/rationality",
      title: "Irrationality",
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
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "5",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "3",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality",
                summary: "",
                title: "Irrationality",
              },
              {
                children: [
                  {
                    id: "7",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "6",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title: "Sibling",
              },
            ],
            id: "2",
            lastModified: "",
            layout: "content",
            permalink: "/parent",
            summary: "",
            title: "Parent page",
          },
          {
            id: "8",
            lastModified: "",
            layout: "content",
            permalink: "/aunt-uncle",
            summary: "",
            title: "Aunt/Uncle that should not appear",
          },
        ],
        id: "1",
        lastModified: "",
        layout: "homepage",
        permalink: "/",
        summary: "",
        title: "Isomer Next",
      },
    }),
  },
}

export const SmallTable: Story = {
  args: {
    content: [
      {
        content: [
          {
            attrs: {
              id: "section1",
              level: 2,
            },
            content: [
              {
                text: "What does the Irrationality Principle support?",
                type: "text",
              },
            ],
            type: "heading",
          },
        ],
        type: "prose",
      },
      {
        content: {
          content: [
            {
              content: [
                {
                  text: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
                  type: "text",
                },
              ],
              type: "paragraph",
            },
          ],
          type: "prose",
        },
        type: "callout",
      },
      {
        content: [
          {
            content: [
              {
                text: "Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            content: [
              {
                content: [
                  {
                    content: [
                      {
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            content: [
                              {
                                text: "Like this, you might have a list of equipments to bring to the luncheon",
                                type: "text",
                              },
                            ],
                            type: "paragraph",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    content: [
                                      { text: "Luncheon meat", type: "text" },
                                    ],
                                    type: "paragraph",
                                  },
                                ],
                                type: "listItem",
                              },
                              {
                                content: [
                                  {
                                    content: [{ text: "Spam", type: "text" }],
                                    type: "paragraph",
                                  },
                                  {
                                    content: [
                                      {
                                        content: [
                                          {
                                            content: [
                                              {
                                                text: "Another level below",
                                                type: "text",
                                              },
                                            ],
                                            type: "paragraph",
                                          },
                                        ],
                                        type: "listItem",
                                      },
                                      {
                                        content: [
                                          {
                                            content: [
                                              {
                                                text: "This is very deep",
                                                type: "text",
                                              },
                                            ],
                                            type: "paragraph",
                                          },
                                        ],
                                        type: "listItem",
                                      },
                                    ],
                                    type: "unorderedList",
                                  },
                                ],
                                type: "listItem",
                              },
                              {
                                content: [
                                  {
                                    content: [{ text: "hello", type: "text" }],
                                    type: "paragraph",
                                  },
                                ],
                                type: "listItem",
                              },
                            ],
                            type: "unorderedList",
                          },
                        ],
                        type: "listItem",
                      },
                      {
                        content: [
                          {
                            content: [{ text: "Back out again", type: "text" }],
                            type: "paragraph",
                          },
                        ],
                        type: "listItem",
                      },
                    ],
                    type: "unorderedList",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
            ],
            type: "unorderedList",
          },
          {
            attrs: {
              id: "section2",
              level: 2,
            },
            content: [
              { text: "Checklist for sheer irrationality", type: "text" },
            ],
            type: "heading",
          },
          {
            content: [
              {
                text: "In the realm of human cognition, irrationality often reigns supreme, defying the logic that ostensibly governs our decisions and actions.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            attrs: {
              id: "section1",
              level: 3,
            },
            content: [{ text: "If you are a small business", type: "text" }],
            type: "heading",
          },
          {
            content: [{ text: "Your business must have:", type: "text" }],
            type: "paragraph",
          },
          {
            content: [
              {
                content: [
                  {
                    content: [
                      {
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "(Suitable for those interested in the interdisciplinary study of cognitive science and psychology.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "Practical applications of rationality in daily life are elucidated by Pinker, offering actionable insights for better decision-making. (Beneficial for individuals seeking practical strategies to improve their decision-making processes.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
            ],
            type: "unorderedList",
          },
          {
            attrs: {
              caption: "A table of IIA countries (2024)",
            },
            content: [
              {
                content: [
                  {
                    content: [
                      {
                        content: [{ text: "Countries", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableHeader",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "Some text", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableHeader",
                  },
                ],
                type: "tableRow",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [{ text: "ASEAN", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "Some text here", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                ],
                type: "tableRow",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [{ text: "Bahrain", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "Some text here", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                ],
                type: "tableRow",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [{ text: "Bangladesh", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "Some text here", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                ],
                type: "tableRow",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [{ text: "Belarus", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "Some text here", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                ],
                type: "tableRow",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [
                          { text: "Belgium and Luxembourg", type: "text" },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                  {
                    content: [
                      {
                        content: [{ text: "Some text here", type: "text" }],
                        type: "paragraph",
                      },
                    ],
                    type: "tableCell",
                  },
                ],
                type: "tableRow",
              },
            ],
            type: "table",
          },
          {
            content: [{ text: "This is yet another paragraph", type: "text" }],
            type: "paragraph",
          },
          {
            attrs: {
              id: "section3",
              level: 3,
            },
            content: [
              {
                text: "Test this is a long heading that comes right before a h4",
                type: "text",
              },
            ],
            type: "heading",
          },
          {
            content: [
              {
                text: "What if got some small text here like the section below this is going to explain blah blah",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            attrs: {
              id: "section3",
              level: 4,
            },
            content: [{ text: "But then, if you are listed", type: "text" }],
            type: "heading",
          },
          {
            content: [
              {
                text: "In the realm of human cognition, irrationality often reigns supreme, defying the logic that ostensibly governs our decisions and actions. It manifests in myriad ways, from the subtle biases that influence our perceptions to the outright contradictions that confound our rational minds. We find ourselves ensnared in cognitive dissonance, grappling with conflicting beliefs and emotions that lead us astray from the path of reason.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            content: [
              {
                text: "Despite our best intentions, we succumb to the allure of irrationality, surrendering to the whims of impulse and emotion. Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "prose",
      },
    ],
    layout: "content",
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      contentPageHeader: {
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
        showThumbnail: false,
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
      },
      lastModified: "2024-05-02T14:12:57.160Z",
      permalink: "/parent/rationality",
      title: "Irrationality",
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
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "5",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "3",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality",
                summary: "",
                title: "Irrationality",
              },
              {
                children: [
                  {
                    id: "7",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "6",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title: "Sibling",
              },
            ],
            id: "2",
            lastModified: "",
            layout: "content",
            permalink: "/parent",
            summary: "",
            title: "Parent page",
          },
          {
            id: "8",
            lastModified: "",
            layout: "content",
            permalink: "/aunt-uncle",
            summary: "",
            title: "Aunt/Uncle that should not appear",
          },
        ],
        id: "1",
        lastModified: "",
        layout: "homepage",
        permalink: "/",
        summary: "",
        title: "Isomer Next",
      },
    }),
  },
}

export const FirstLevelPage: Story = {
  args: {
    content: [
      {
        content: [
          {
            attrs: {
              id: "section1",
              level: 2,
            },
            content: [
              {
                text: "What does the Irrationality Principle support?",
                type: "text",
              },
            ],
            type: "heading",
          },
        ],
        type: "prose",
      },
      {
        content: {
          content: [
            {
              content: [
                {
                  text: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
                  type: "text",
                },
              ],
              type: "paragraph",
            },
          ],
          type: "prose",
        },
        type: "callout",
      },
      {
        content: [
          {
            content: [
              {
                text: "Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            content: [
              {
                content: [
                  {
                    content: [
                      {
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            content: [
                              {
                                text: "Like this, you might have a list of equipments to bring to the luncheon",
                                type: "text",
                              },
                            ],
                            type: "paragraph",
                          },
                          {
                            content: [
                              {
                                content: [
                                  {
                                    content: [
                                      { text: "Luncheon meat", type: "text" },
                                    ],
                                    type: "paragraph",
                                  },
                                ],
                                type: "listItem",
                              },
                              {
                                content: [
                                  {
                                    content: [{ text: "Spam", type: "text" }],
                                    type: "paragraph",
                                  },
                                  {
                                    content: [
                                      {
                                        content: [
                                          {
                                            content: [
                                              {
                                                text: "Another level below",
                                                type: "text",
                                              },
                                            ],
                                            type: "paragraph",
                                          },
                                        ],
                                        type: "listItem",
                                      },
                                      {
                                        content: [
                                          {
                                            content: [
                                              {
                                                text: "This is very deep",
                                                type: "text",
                                              },
                                            ],
                                            type: "paragraph",
                                          },
                                        ],
                                        type: "listItem",
                                      },
                                    ],
                                    type: "unorderedList",
                                  },
                                ],
                                type: "listItem",
                              },
                              {
                                content: [
                                  {
                                    content: [{ text: "hello", type: "text" }],
                                    type: "paragraph",
                                  },
                                ],
                                type: "listItem",
                              },
                            ],
                            type: "unorderedList",
                          },
                        ],
                        type: "listItem",
                      },
                      {
                        content: [
                          {
                            content: [{ text: "Back out again", type: "text" }],
                            type: "paragraph",
                          },
                        ],
                        type: "listItem",
                      },
                    ],
                    type: "unorderedList",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
            ],
            type: "unorderedList",
          },
          {
            attrs: {
              id: "section2",
              level: 2,
            },
            content: [
              { text: "Checklist for sheer irrationality", type: "text" },
            ],
            type: "heading",
          },
          {
            attrs: {
              id: "section1",
              level: 3,
            },
            content: [{ text: "If you are a small business", type: "text" }],
            type: "heading",
          },
          {
            content: [{ text: "Your business must have:", type: "text" }],
            type: "paragraph",
          },
          {
            content: [
              {
                content: [
                  {
                    content: [
                      {
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "(Suitable for those interested in the interdisciplinary study of cognitive science and psychology.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "Practical applications of rationality in daily life are elucidated by Pinker, offering actionable insights for better decision-making. (Beneficial for individuals seeking practical strategies to improve their decision-making processes.)",
                        type: "text",
                      },
                    ],
                    type: "paragraph",
                  },
                ],
                type: "listItem",
              },
            ],
            type: "unorderedList",
          },
          {
            content: [{ text: "This is yet another paragraph", type: "text" }],
            type: "paragraph",
          },
          {
            attrs: {
              id: "section3",
              level: 4,
            },
            content: [{ text: "But then, if you are listed", type: "text" }],
            type: "heading",
          },
          {
            content: [
              {
                text: "In the realm of human cognition, irrationality often reigns supreme, defying the logic that ostensibly governs our decisions and actions. It manifests in myriad ways, from the subtle biases that influence our perceptions to the outright contradictions that confound our rational minds. We find ourselves ensnared in cognitive dissonance, grappling with conflicting beliefs and emotions that lead us astray from the path of reason. Despite our best intentions, we succumb to the allure of irrationality, surrendering to the whims of impulse and emotion. Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "prose",
      },
    ],
    layout: "content",
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      contentPageHeader: {
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
        showThumbnail: false,
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
      },
      lastModified: "2024-05-02T14:12:57.160Z",
      permalink: "/content",
      title: "Content page",
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
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "5",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "3",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality",
                summary: "",
                title: "Irrationality",
              },
              {
                children: [
                  {
                    id: "7",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "6",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title: "Sibling",
              },
            ],
            id: "2",
            lastModified: "",
            layout: "content",
            permalink: "/content",
            summary: "",
            title: "Content page",
          },
          {
            id: "8",
            lastModified: "",
            layout: "content",
            permalink: "/aunt-uncle",
            summary: "",
            title: "Aunt/Uncle that should not appear",
          },
        ],
        id: "1",
        lastModified: "",
        layout: "homepage",
        permalink: "/",
        summary: "",
        title: "Isomer Next",
      },
    }),
  },
}

export const MultipleAccordions: Story = {
  args: {
    content: [
      {
        details: {
          content: [],
          type: "prose",
        },
        summary: "This accordion should not have a margin above",
        type: "accordion",
      },
      {
        content: [
          {
            attrs: {
              level: 3,
            },
            content: [
              {
                text: "Some heading",
                type: "text",
              },
            ],
            type: "heading",
          },
        ],
        type: "prose",
      },
      {
        details: {
          content: [],
          type: "prose",
        },
        summary: "Some accordion",
        type: "accordion",
      },
      {
        details: {
          content: [],
          type: "prose",
        },
        summary: "More accordion",
        type: "accordion",
      },
      {
        details: {
          content: [],
          type: "prose",
        },
        summary: "Last accordion in this section",
        type: "accordion",
      },
      {
        content: [
          {
            attrs: {
              level: 3,
            },
            content: [
              {
                text: "More heading",
                type: "text",
              },
            ],
            type: "heading",
          },
        ],
        type: "prose",
      },
      {
        details: {
          content: [],
          type: "prose",
        },
        summary: "Should have a spacing above",
        type: "accordion",
      },
    ],
    layout: "content",
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      contentPageHeader: {
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
        showThumbnail: false,
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
      },
      lastModified: "2024-05-02T14:12:57.160Z",
      permalink: "/content",
      title: "Content page",
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
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "5",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "3",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality",
                summary: "",
                title: "Irrationality",
              },
              {
                children: [
                  {
                    id: "7",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "6",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title: "Sibling",
              },
            ],
            id: "2",
            lastModified: "",
            layout: "content",
            permalink: "/content",
            summary: "",
            title: "Content page",
          },
          {
            id: "8",
            lastModified: "",
            layout: "content",
            permalink: "/aunt-uncle",
            summary: "",
            title: "Aunt/Uncle that should not appear",
          },
        ],
        id: "1",
        lastModified: "",
        layout: "homepage",
        permalink: "/",
        summary: "",
        title: "Isomer Next",
      },
    }),
  },
}

export const MultipleInfobars: Story = {
  args: {
    content: [
      {
        description: "About a sentence worth of description here",
        title: "First item in the page - should not have a gap above",
        type: "infobar",
      },
      {
        content: [
          {
            content: [
              {
                text: "should have a gap below",
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "prose",
      },
      {
        description: "About a sentence worth of description here",
        title: "This is a place where you can put nice content",
        type: "infobar",
      },
      {
        description: "About a sentence worth of description here",
        title: "Should have a gap above",
        type: "infobar",
      },
    ],
    layout: "content",
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      contentPageHeader: {
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
        showThumbnail: false,
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
      },
      lastModified: "2024-05-02T14:12:57.160Z",
      permalink: "/content",
      title: "Content page",
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
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "5",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "3",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality",
                summary: "",
                title: "Irrationality",
              },
              {
                children: [
                  {
                    id: "7",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "6",
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "",
                title: "Sibling",
              },
            ],
            id: "2",
            lastModified: "",
            layout: "content",
            permalink: "/content",
            summary: "",
            title: "Content page",
          },
          {
            id: "8",
            lastModified: "",
            layout: "content",
            permalink: "/aunt-uncle",
            summary: "",
            title: "Aunt/Uncle that should not appear",
          },
        ],
        id: "1",
        lastModified: "",
        layout: "homepage",
        permalink: "/",
        summary: "",
        title: "Isomer Next",
      },
    }),
  },
}

const DgsUrl = generateDgsUrl({
  filters: {
    headerKey1: "value1",
    headerKey2: "value2",
  },
  resourceId: "PLACEHOLDER_RESOURCE_ID",
})

export const DynamicComponentList: Story = {
  args: {
    content: [
      {
        component: {
          description: "[dgs:description]",
          methods: "[dgs:methods]",
          otherInformation: "[dgs:other_information]",
          title: "[dgs:entity_name]",
          type: "contactinformation",
        },
        dataSource: {
          filters: [
            {
              fieldKey: "headerKey1",
              fieldValue: "value1",
            },
            {
              fieldKey: "headerKey2",
              fieldValue: "value2",
            },
          ],
          resourceId: "PLACEHOLDER_RESOURCE_ID",
          type: "dgs",
        },
        type: "dynamiccomponentlist",
      },
    ],
    layout: "content",
    page: {
      contentPageHeader: {
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
        showThumbnail: false,
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
      },
      lastModified: "2024-05-02T14:12:57.160Z",
      permalink: "/content",
      title: "Content page",
    },
    site: generateSiteConfig({}),
  },
  parameters: {
    msw: {
      handlers: [
        http.get(DgsUrl, () =>
          HttpResponse.json({
            result: {
              records: [
                {
                  description: "Embassy of the Republic of Singapore - Algeria",
                  entity_name: "Sentosa",
                  methods: JSON.stringify([
                    {
                      label: "Ambassador (Non-Resident)",
                      method: "person",
                      values: ["Mr MOHAMMAD Alami Musa"],
                    },
                    {
                      label: "Chancery",
                      method: "address",
                      values: ["c/o Ministry of Foreign Affairs"],
                    },
                    {
                      label: "Telephone",
                      method: "telephone",
                      values: ["+65-63798000 (MFA)"],
                    },
                    {
                      label: "Fax",
                      method: "fax",
                      values: ["+65-64747885 (MFA)"],
                    },
                    {
                      label: "Email",
                      method: "email",
                      values: ["do-not-reply@isomer.gov.sg"],
                    },
                    {
                      label: "Website",
                      method: "website",
                      values: ["https://www.isomer.gov.sg"],
                    },
                    {
                      label: "Operating Hours",
                      method: "operating_hours",
                      values: ["8.30 am to 5.00 pm"],
                    },
                    {
                      label: "Not Telegram",
                      values: [
                        "https://this-should-still-be-hyperlinked.isomer.gov.sg",
                      ],
                    },
                  ]),
                  other_information: JSON.stringify({
                    label: "Other Information",
                    value:
                      "For cats and dogs enquiries, please write to this-should-not-by-hyperlinked@isomer.gov.sg. Please note that the Isomer is the <b>bold authority</b> responsible for <a href='https://this-should-not-be-showup.isomer.gov.sg'>cats and dogs matters</a>.",
                  }),
                },
                {
                  description:
                    "Embassy of the Republic of Singapore - Algeria 2",
                  entity_name: "Sentosa 2",
                  methods: JSON.stringify([
                    {
                      label: "Ambassador (Non-Resident) 2",
                      method: "person",
                      values: ["Mr MOHAMMAD Alami Musa 2"],
                    },
                    {
                      label: "Chancery 2",
                      method: "address",
                      values: ["c/o Ministry of Foreign Affairs 2"],
                    },
                    {
                      label: "Telephone",
                      method: "telephone",
                      values: ["+65-63798000 (MFA)"],
                    },
                    {
                      label: "Fax 2",
                      method: "fax",
                      values: ["+65-64747885 (MFA) 2"],
                    },
                    {
                      label: "Email 2",
                      method: "email",
                      values: ["do-not-reply-2@isomer.gov.sg"],
                    },
                    {
                      label: "Website 2",
                      method: "website",
                      values: ["https://www.isomer-2.gov.sg"],
                    },
                    {
                      label: "Operating Hours 2",
                      method: "operating_hours",
                      values: ["8.30 am to 5.00 pm 2"],
                    },
                    {
                      label: "Not Telegram 2",
                      values: [
                        "https://this-should-still-be-hyperlinked-2.isomer.gov.sg",
                      ],
                    },
                  ]),
                  other_information: JSON.stringify({
                    label: "Other Information 2",
                    value:
                      "2 For cats and dogs enquiries, please write to this-should-not-by-hyperlinked@isomer.gov.sg. Please note that the Isomer is the <b>bold authority</b> responsible for <a href='https://this-should-not-be-showup.isomer.gov.sg'>cats and dogs matters</a>.",
                  }),
                },
              ],
            },
            success: true,
          }),
        ),
      ],
    },
  },
}

export const DynamicComponentListLoading: Story = {
  args: {
    content: [
      {
        component: {
          description: "[dgs:description]",
          methods: "[dgs:methods]",
          otherInformation: "[dgs:other_information]",
          title: "[dgs:entity_name]",
          type: "contactinformation",
        },
        dataSource: {
          filters: [
            {
              fieldKey: "headerKey1",
              fieldValue: "value1",
            },
            {
              fieldKey: "headerKey2",
              fieldValue: "value2",
            },
          ],
          resourceId: "PLACEHOLDER_RESOURCE_ID",
          type: "dgs",
        },
        type: "dynamiccomponentlist",
      },
    ],
    layout: "content",
    page: {
      contentPageHeader: {
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
        showThumbnail: false,
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
      },
      lastModified: "2024-05-02T14:12:57.160Z",
      permalink: "/content",
      title: "Content page",
    },
    site: generateSiteConfig({}),
  },
  name: "DynamicComponentList (Loading)",
  parameters: {
    msw: {
      handlers: [
        http.get(
          DgsUrl,
          async () =>
            await new Promise(() => {
              // Never resolve the promise
            }),
        ),
      ],
    },
  },
}

export const AudioEmbedStory: Story = {
  args: {
    content: [
      {
        title: "Spotify show embed",
        type: "audio",
        url: "https://open.spotify.com/embed/show/66PYiIthr1KqQhJ82XH4DN",
      },
      {
        title: "Apple Podcast show embed",
        type: "audio",
        url: "https://embed.podcasts.apple.com/us/podcast/biblioasia-podcast/id1688142751",
      },
    ],
    layout: "content",
    page: {
      contentPageHeader: {
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
        showThumbnail: false,
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
      },
      lastModified: "2024-05-02T14:12:57.160Z",
      permalink: "/content",
      title: "Content page",
    },
    site: generateSiteConfig({}),
  },
  parameters: {
    // Delay the Chromatic snapshot so iframes have time to load and don’t appear as white blocks.
    chromatic: {
      ...withChromaticModes(["mobile", "tablet", "desktop"]),
      delay: 5000,
    },
  },
}

export const VideoEmbedStory: Story = {
  args: {
    content: [
      {
        content: [
          {
            attrs: { id: "facebook-reel", level: 2 },
            content: [{ text: "Vertical video (Facebook Reel)", type: "text" }],
            type: "heading",
          },
          {
            content: [
              {
                text: "Facebook Reels are vertical (9:16) videos. They render in a width-capped portrait box, centred within the content column, so they are not clipped or blown up to full-page height.",
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
    layout: "content",
    page: {
      contentPageHeader: {
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
        showThumbnail: false,
        summary:
          "Showing how different video embeds render within a content page layout, including a vertical Facebook Reel.",
      },
      lastModified: "2024-05-02T14:12:57.160Z",
      permalink: "/content",
      title: "Content page",
    },
    site: generateSiteConfig({}),
  },
  parameters: {
    // Delay the Chromatic snapshot so iframes have time to load and don’t appear as white blocks.
    chromatic: {
      ...withChromaticModes(["mobile", "tablet", "desktop"]),
      delay: 10_000,
    },
  },
}
