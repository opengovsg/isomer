import type { Meta, StoryFn } from "@storybook/react"
import Content from "./Content"
import { ContentPageSchema } from "~/engine"

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
    siteMap: [],
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
  },
  page: {
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
    sideRail: {
      parentTitle: "Parent page",
      parentUrl: "/parent",
      pages: [
        {
          title: "Sibling 1",
          url: "/link1",
        },
        {
          title: "Steven Pinker's Rationality",
          url: "/link2",
          isCurrent: true,
        },
        {
          title: "Sibling 2",
          url: "/link3",
        },
      ],
    },
    tableOfContents: {
      items: [
        {
          content: "What does the Irrationality Principle support?",
          anchorLink: "#section1",
        },
        {
          content: "Checklist for sheer irrationality",
          anchorLink: "#section2",
        },
        {
          content: "Section 3",
          anchorLink: "#section3",
        },
      ],
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
