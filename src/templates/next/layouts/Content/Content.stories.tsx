import type { Meta, StoryFn } from "@storybook/react"
import type { ContentPageSchema } from "~/engine"
import Content from "./Content"

export default {
  title: "Next/Layouts/Content",
  component: Content,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<ContentPageSchema> = (args) => <Content {...args} />

export const Default = Template.bind({})
Default.args = {
  layout: "content",
  site: {
    siteName: "Isomer Next",
    siteMap: {
      title: "Isomer Next",
      permalink: "/",
      lastModified: "",
      layout: "homepage",
      summary: "",
      children: [
        {
          title: "Parent page",
          permalink: "/parent",
          lastModified: "",
          layout: "content",
          summary: "",
          children: [
            {
              title: "Irrationality",
              permalink: "/parent/rationality",
              lastModified: "",
              layout: "content",
              summary: "",
              children: [
                {
                  title: "For Individuals",
                  permalink: "/parent/rationality/child-page-2",
                  lastModified: "",
                  layout: "content",
                  summary: "",
                },
                {
                  title: "Steven Pinker's Rationality",
                  permalink: "/parent/rationality/child-page-2",
                  lastModified: "",
                  layout: "content",
                  summary: "",
                },
              ],
            },
            {
              title: "Sibling",
              permalink: "/parent/sibling",
              lastModified: "",
              layout: "content",
              summary: "",
              children: [
                {
                  title: "Child that should not appear",
                  permalink: "/parent/sibling/child-page-2",
                  lastModified: "",
                  layout: "content",
                  summary: "",
                },
              ],
            },
          ],
        },
        {
          title: "Aunt/Uncle that should not appear",
          permalink: "/aunt-uncle",
          lastModified: "",
          layout: "content",
          summary: "",
        },
      ],
    },
    theme: "isomer-next",
    isGovernment: true,
    logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
    navBarItems: [],
    footerItems: {
      privacyStatementLink: "https://www.isomer.gov.sg/privacy",
      termsOfUseLink: "https://www.isomer.gov.sg/terms",
      siteNavItems: [],
    },
    lastUpdated: "1 Jan 2021",
    search: {
      type: "localSearch",
      searchUrl: "/search",
    },
    notification: "This is a notification",
  },
  page: {
    permalink: "/parent/rationality",
    lastModified: "2024-05-02T14:12:57.160Z",
    title: "Content page",
    description: "A Next.js starter for Isomer",
    contentPageHeader: {
      summary:
        "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
      buttonLabel: "Submit a proposal",
      buttonUrl: "/submit-proposal",
    },
  },
  content: [
    {
      type: "heading",
      id: "section1",
      level: 2,
      content: [
        {
          type: "text",
          text: "What does the Irrationality Principle support?",
        },
      ],
    },
    {
      type: "callout",
      variant: "info",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
        },
      ],
    },
    {
      type: "unorderedlist",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
                },
              ],
            },
          ],
        },
        {
          type: "unorderedlist",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Like this, you might have a list of equipments to bring to the luncheon",
                    },
                  ],
                },
              ],
            },
            {
              type: "unorderedlist",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Luncheon meat" }],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Spam" }],
                    },
                  ],
                },
                {
                  type: "unorderedlist",
                  content: [
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            { type: "text", text: "Another level below" },
                          ],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            { type: "text", text: "This is very deep" },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "hello" }],
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Back out again" }],
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      id: "section2",
      level: 2,
      content: [{ type: "text", text: "Checklist for sheer irrationality" }],
    },
    {
      type: "heading",
      id: "section1",
      level: 3,
      content: [{ type: "text", text: "If you are a small business" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "Your business must have:" }],
    },
    {
      type: "unorderedlist",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "(Suitable for those interested in the interdisciplinary study of cognitive science and psychology.)",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Practical applications of rationality in daily life are elucidated by Pinker, offering actionable insights for better decision-making. (Beneficial for individuals seeking practical strategies to improve their decision-making processes.)",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "table",
      caption: "A table of IIA countries (2024)",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableHeader",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Countries" }],
                },
              ],
            },
            {
              type: "tableHeader",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Date of Entry into Force" }],
                },
              ],
            },
            {
              type: "tableHeader",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "IIA Text" }],
                },
              ],
            },
            {
              type: "tableHeader",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Some numbers" }],
                },
              ],
            },
            {
              type: "tableHeader",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Remarks" }],
                },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "ASEAN" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "2 Aug 1998" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "<a href='https://www.asean.org/asean/asean-agreements-on-investment/'>EN download (3.2 MB)</a>",
                    },
                  ],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "123,456" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
                    },
                  ],
                },
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
                    },
                  ],
                },
                {
                  type: "unorderedlist",
                  content: [
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            {
                              type: "text",
                              text: "<a href='https://google.com'>AANZFTA</a>",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            {
                              type: "text",
                              text: "<a href='https://google.com'>ACFTA</a>",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            {
                              type: "text",
                              text: "<a href='https://google.com'>AKFTA</a>",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            {
                              type: "text",
                              text: "<a href='https://google.com'>AIFTA</a>",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Bahrain" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "8 Dec 2004" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                    },
                  ],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "123,456" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
                    },
                  ],
                },
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
                    },
                  ],
                },
                {
                  type: "orderedlist",
                  content: [
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            {
                              type: "text",
                              text: "<a href='https://google.com'>AANZFTA</a>",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            {
                              type: "text",
                              text: "<a href='https://google.com'>ACFTA</a>",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            {
                              type: "text",
                              text: "<a href='https://google.com'>AKFTA</a>",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            {
                              type: "text",
                              text: "<a href='https://google.com'>AIFTA</a>",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Bangladesh" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "19 Nov 2004" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                    },
                  ],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "123,456" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Some text" }],
                },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Belarus" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "13 Jan 2001" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                    },
                  ],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "123,456" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "" }] },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Belgium and Luxembourg" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "27 Nov 1980" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                    },
                  ],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "123,456" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "" }] },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "This is yet another paragraph" }],
    },
    {
      type: "heading",
      id: "section3",
      level: 4,
      content: [{ type: "text", text: "But then, if you are listed" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "In the realm of human cognition, irrationality often reigns supreme, defying the logic that ostensibly governs our decisions and actions. It manifests in myriad ways, from the subtle biases that influence our perceptions to the outright contradictions that confound our rational minds. We find ourselves ensnared in cognitive dissonance, grappling with conflicting beliefs and emotions that lead us astray from the path of reason. Despite our best intentions, we succumb to the allure of irrationality, surrendering to the whims of impulse and emotion. Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
        },
      ],
    },
  ],
}

export const NoTable = Template.bind({})
NoTable.args = {
  layout: "content",
  site: {
    siteName: "Isomer Next",
    siteMap: {
      title: "Isomer Next",
      permalink: "/",
      lastModified: "",
      layout: "homepage",
      summary: "",
      children: [
        {
          title: "Parent page",
          permalink: "/parent",
          lastModified: "",
          layout: "content",
          summary: "",
          children: [
            {
              title: "Irrationality",
              permalink: "/parent/rationality",
              lastModified: "",
              layout: "content",
              summary: "",
              children: [
                {
                  title: "For Individuals",
                  permalink: "/parent/rationality/child-page-2",
                  lastModified: "",
                  layout: "content",
                  summary: "",
                },
                {
                  title: "Steven Pinker's Rationality",
                  permalink: "/parent/rationality/child-page-2",
                  lastModified: "",
                  layout: "content",
                  summary: "",
                },
              ],
            },
            {
              title: "Sibling",
              permalink: "/parent/sibling",
              lastModified: "",
              layout: "content",
              summary: "",
              children: [
                {
                  title: "Child that should not appear",
                  permalink: "/parent/sibling/child-page-2",
                  lastModified: "",
                  layout: "content",
                  summary: "",
                },
              ],
            },
          ],
        },
        {
          title: "Aunt/Uncle that should not appear",
          permalink: "/aunt-uncle",
          lastModified: "",
          layout: "content",
          summary: "",
        },
      ],
    },
    theme: "isomer-next",
    isGovernment: true,
    logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
    navBarItems: [],
    footerItems: {
      privacyStatementLink: "https://www.isomer.gov.sg/privacy",
      termsOfUseLink: "https://www.isomer.gov.sg/terms",
      siteNavItems: [],
    },
    lastUpdated: "1 Jan 2021",
    search: {
      type: "localSearch",
      searchUrl: "/search",
    },
  },
  page: {
    permalink: "/parent/rationality",
    title: "Content page",
    description: "A Next.js starter for Isomer",
    contentPageHeader: {
      summary:
        "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
      buttonLabel: "Submit a proposal",
      buttonUrl: "/submit-proposal",
    },
  },
  content: [
    {
      type: "heading",
      id: "section1",
      level: 2,
      content: [
        {
          type: "text",
          text: "What does the Irrationality Principle support?",
        },
      ],
    },
    {
      type: "callout",
      variant: "info",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
        },
      ],
    },
    {
      type: "unorderedlist",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
                },
              ],
            },
          ],
        },
        {
          type: "unorderedlist",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Like this, you might have a list of equipments to bring to the luncheon",
                    },
                  ],
                },
              ],
            },
            {
              type: "unorderedlist",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Luncheon meat" }],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Spam" }],
                    },
                  ],
                },
                {
                  type: "unorderedlist",
                  content: [
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            { type: "text", text: "Another level below" },
                          ],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            { type: "text", text: "This is very deep" },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "hello" }],
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Back out again" }],
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      id: "section2",
      level: 2,
      content: [{ type: "text", text: "Checklist for sheer irrationality" }],
    },
    {
      type: "heading",
      id: "section1",
      level: 3,
      content: [{ type: "text", text: "If you are a small business" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "Your business must have:" }],
    },
    {
      type: "unorderedlist",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "(Suitable for those interested in the interdisciplinary study of cognitive science and psychology.)",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Practical applications of rationality in daily life are elucidated by Pinker, offering actionable insights for better decision-making. (Beneficial for individuals seeking practical strategies to improve their decision-making processes.)",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "This is yet another paragraph" }],
    },
    {
      type: "heading",
      id: "section3",
      level: 4,
      content: [{ type: "text", text: "But then, if you are listed" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "In the realm of human cognition, irrationality often reigns supreme, defying the logic that ostensibly governs our decisions and actions. It manifests in myriad ways, from the subtle biases that influence our perceptions to the outright contradictions that confound our rational minds. We find ourselves ensnared in cognitive dissonance, grappling with conflicting beliefs and emotions that lead us astray from the path of reason. Despite our best intentions, we succumb to the allure of irrationality, surrendering to the whims of impulse and emotion. Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
        },
      ],
    },
  ],
}

export const SmallTable = Template.bind({})
SmallTable.args = {
  layout: "content",
  site: {
    siteName: "Isomer Next",
    siteMap: {
      title: "Isomer Next",
      permalink: "/",
      lastModified: "",
      layout: "homepage",
      summary: "",
      children: [
        {
          title: "Parent page",
          permalink: "/parent",
          lastModified: "",
          layout: "content",
          summary: "",
          children: [
            {
              title: "Irrationality",
              permalink: "/parent/rationality",
              lastModified: "",
              layout: "content",
              summary: "",
              children: [
                {
                  title: "For Individuals",
                  permalink: "/parent/rationality/child-page-2",
                  lastModified: "",
                  layout: "content",
                  summary: "",
                },
                {
                  title: "Steven Pinker's Rationality",
                  permalink: "/parent/rationality/child-page-2",
                  lastModified: "",
                  layout: "content",
                  summary: "",
                },
              ],
            },
            {
              title: "Sibling",
              permalink: "/parent/sibling",
              lastModified: "",
              layout: "content",
              summary: "",
              children: [
                {
                  title: "Child that should not appear",
                  permalink: "/parent/sibling/child-page-2",
                  lastModified: "",
                  layout: "content",
                  summary: "",
                },
              ],
            },
          ],
        },
        {
          title: "Aunt/Uncle that should not appear",
          permalink: "/aunt-uncle",
          lastModified: "",
          layout: "content",
          summary: "",
        },
      ],
    },
    theme: "isomer-next",
    isGovernment: true,
    logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
    navBarItems: [],
    footerItems: {
      privacyStatementLink: "https://www.isomer.gov.sg/privacy",
      termsOfUseLink: "https://www.isomer.gov.sg/terms",
      siteNavItems: [],
    },
    lastUpdated: "1 Jan 2021",
    search: {
      type: "localSearch",
      searchUrl: "/search",
    },
  },
  page: {
    permalink: "/parent/rationality",
    title: "Content page",
    description: "A Next.js starter for Isomer",
    contentPageHeader: {
      summary:
        "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
      buttonLabel: "Submit a proposal",
      buttonUrl: "/submit-proposal",
    },
  },
  content: [
    {
      type: "heading",
      id: "section1",
      level: 2,
      content: [
        {
          type: "text",
          text: "What does the Irrationality Principle support?",
        },
      ],
    },
    {
      type: "callout",
      variant: "info",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
        },
      ],
    },
    {
      type: "unorderedlist",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
                },
              ],
            },
          ],
        },
        {
          type: "unorderedlist",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Like this, you might have a list of equipments to bring to the luncheon",
                    },
                  ],
                },
              ],
            },
            {
              type: "unorderedlist",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Luncheon meat" }],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Spam" }],
                    },
                  ],
                },
                {
                  type: "unorderedlist",
                  content: [
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            { type: "text", text: "Another level below" },
                          ],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            { type: "text", text: "This is very deep" },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "hello" }],
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Back out again" }],
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      id: "section2",
      level: 2,
      content: [{ type: "text", text: "Checklist for sheer irrationality" }],
    },
    {
      type: "heading",
      id: "section1",
      level: 3,
      content: [{ type: "text", text: "If you are a small business" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "Your business must have:" }],
    },
    {
      type: "unorderedlist",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "(Suitable for those interested in the interdisciplinary study of cognitive science and psychology.)",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Practical applications of rationality in daily life are elucidated by Pinker, offering actionable insights for better decision-making. (Beneficial for individuals seeking practical strategies to improve their decision-making processes.)",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "table",
      caption: "A table of IIA countries (2024)",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableHeader",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Countries" }],
                },
              ],
            },
            {
              type: "tableHeader",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Some text" }],
                },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "ASEAN" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Some text here" }],
                },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Bahrain" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Some text here" }],
                },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Bangladesh" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Some text here" }],
                },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Belarus" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Some text here" }],
                },
              ],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Belgium and Luxembourg" }],
                },
              ],
            },
            {
              type: "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Some text here" }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "This is yet another paragraph" }],
    },
    {
      type: "heading",
      id: "section3",
      level: 4,
      content: [{ type: "text", text: "But then, if you are listed" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "In the realm of human cognition, irrationality often reigns supreme, defying the logic that ostensibly governs our decisions and actions. It manifests in myriad ways, from the subtle biases that influence our perceptions to the outright contradictions that confound our rational minds. We find ourselves ensnared in cognitive dissonance, grappling with conflicting beliefs and emotions that lead us astray from the path of reason. Despite our best intentions, we succumb to the allure of irrationality, surrendering to the whims of impulse and emotion. Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
        },
      ],
    },
  ],
}
