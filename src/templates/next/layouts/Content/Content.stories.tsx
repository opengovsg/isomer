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
      children: [
        {
          title: "Parent page",
          permalink: "/parent",
          children: [
            {
              title: "Irrationality",
              permalink: "/parent/rationality",
              children: [
                {
                  title: "For Individuals",
                  permalink: "/parent/rationality/child-page-2",
                },
                {
                  title: "Steven Pinker's Rationality",
                  permalink: "/parent/rationality/child-page-2",
                },
              ],
            },
            {
              title: "Sibling",
              permalink: "/parent/sibling",
              children: [
                {
                  title: "Child that should not appear",
                  permalink: "/parent/sibling/child-page-2",
                },
              ],
            },
          ],
        },
        {
          title: "Aunt/Uncle that should not appear",
          permalink: "/aunt-uncle",
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
      title: "Steven Pinker’s Rationality",
      summary:
        "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
      breadcrumb: {
        links: [
          {
            title: "Irrationality",
            url: "/",
          },
          {
            title: "For Individuals",
            url: "/individuals",
          },
          {
            title: "Steven Pinker's Rationality",
            url: "/rationality",
          },
        ],
      },
      buttonLabel: "Submit a proposal",
      buttonUrl: "/submit-proposal",
    },
  },
  content: [
    {
      type: "heading",
      id: "section1",
      level: 2,
      content: "What does the Irrationality Principle support?",
    },
    {
      type: "callout",
      variant: "info",
      content: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
    },
    {
      type: "paragraph",
      content:
        "Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
    },
    {
      type: "unorderedlist",
      items: [
        "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
        "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
        {
          type: "unorderedlist",
          items: [
            "Like this, you might have a list of equipments to bring to the luncheon",
            {
              type: "unorderedlist",
              items: [
                "Luncheon meat",
                "Spam",
                {
                  type: "unorderedlist",
                  items: ["Another level below", "This is very deep"],
                },
                "hello",
              ],
            },
            "Back out again",
          ],
        },
        "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
      ],
    },
    {
      type: "heading",
      id: "section2",
      level: 2,
      content: "Checklist for sheer irrationality",
    },
    {
      type: "heading",
      id: "section1",
      level: 3,
      content: "If you are a small business",
    },
    {
      type: "paragraph",
      content: "Your business must have:",
    },
    {
      type: "unorderedlist",
      items: [
        "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
        "(Suitable for those interested in the interdisciplinary study of cognitive science and psychology.)",
        "Practical applications of rationality in daily life are elucidated by Pinker, offering actionable insights for better decision-making. (Beneficial for individuals seeking practical strategies to improve their decision-making processes.)",
      ],
    },
    {
      type: "table",
      caption: "A table of IIA countries (2024)",
      rows: [
        {
          cells: [
            { variant: "tableHeader", value: "Countries" },
            { variant: "tableHeader", value: "Date of Entry into Force" },
            { variant: "tableHeader", value: "IIA Text" },
            { variant: "tableHeader", value: "Some numbers" },
            { variant: "tableHeader", value: "Remarks" },
          ],
        },
        {
          cells: [
            { variant: "tableCell", value: ["ASEAN"] },
            { variant: "tableCell", value: ["2 Aug 1998"] },
            {
              variant: "tableCell",
              value: [
                "<a href='https://www.asean.org/asean/asean-agreements-on-investment/'>EN download (3.2 MB)</a>",
              ],
            },
            { variant: "tableCell", value: ["123,456"] },
            {
              variant: "tableCell",
              value: [
                "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
                "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
                {
                  type: "unorderedlist",
                  items: [
                    "<a href='https://google.com'>AANZFTA</a>",
                    "<a href='https://google.com'>ACFTA</a>",
                    "<a href='https://google.com'>AKFTA</a>",
                    "<a href='https://google.com'>AIFTA</a>",
                  ],
                },
              ],
            },
          ],
        },
        {
          cells: [
            { variant: "tableCell", value: ["Bahrain"] },
            { variant: "tableCell", value: ["8 Dec 2004"] },
            {
              variant: "tableCell",
              value: ["<a href='https://google.com/'>EN download (2.4 MB)</a>"],
            },
            { variant: "tableCell", value: ["123,456"] },
            {
              variant: "tableCell",
              value: [
                "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
                "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
                {
                  type: "orderedlist",
                  items: [
                    "<a href='https://google.com'>AANZFTA</a>",
                    "<a href='https://google.com'>ACFTA</a>",
                    "<a href='https://google.com'>AKFTA</a>",
                    "<a href='https://google.com'>AIFTA</a>",
                  ],
                },
              ],
            },
          ],
        },
        {
          cells: [
            { variant: "tableCell", value: ["Bangladesh"] },
            { variant: "tableCell", value: ["19 Nov 2004"] },
            {
              variant: "tableCell",
              value: ["<a href='https://google.com/'>EN download (2.4 MB)</a>"],
            },
            { variant: "tableCell", value: ["123,456"] },
            {
              variant: "tableCell",
              value: ["Some text"],
            },
          ],
        },
        {
          cells: [
            { variant: "tableCell", value: ["Belarus"] },
            { variant: "tableCell", value: ["13 Jan 2001"] },
            {
              variant: "tableCell",
              value: ["<a href='https://google.com/'>EN download (2.4 MB)</a>"],
            },
            { variant: "tableCell", value: ["123,456"] },
            {
              variant: "tableCell",
              value: [""],
            },
          ],
        },
        {
          cells: [
            { variant: "tableCell", value: ["Belgium and Luxembourg"] },
            { variant: "tableCell", value: ["27 Nov 1980"] },
            {
              variant: "tableCell",
              value: ["<a href='https://google.com/'>EN download (2.4 MB)</a>"],
            },
            { variant: "tableCell", value: ["123,456"] },
            {
              variant: "tableCell",
              value: [""],
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: "This is yet another paragraph",
    },
    {
      type: "heading",
      id: "section3",
      level: 4,
      content: "But then, if you are listed",
    },
    {
      type: "paragraph",
      content:
        "In the realm of human cognition, irrationality often reigns supreme, defying the logic that ostensibly governs our decisions and actions. It manifests in myriad ways, from the subtle biases that influence our perceptions to the outright contradictions that confound our rational minds. We find ourselves ensnared in cognitive dissonance, grappling with conflicting beliefs and emotions that lead us astray from the path of reason. Despite our best intentions, we succumb to the allure of irrationality, surrendering to the whims of impulse and emotion. Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
    },
  ],
}
