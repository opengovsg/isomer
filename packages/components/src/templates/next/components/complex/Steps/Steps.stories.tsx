import type { Meta, StoryObj } from "@storybook/react-vite"
import { userEvent, within } from "storybook/test"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { Steps } from "./Steps"

const meta: Meta<typeof Steps> = {
  title: "Next/Components/Steps",
  component: Steps,
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["desktop", "mobile"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    site: generateSiteConfig(),
  },
}
export default meta
type Story = StoryObj<typeof Steps>

export const Default: Story = {
  args: {
    title: "How to apply for a grant",
    description:
      "Follow these steps to submit your grant application. Make sure you have all required documents ready before you begin.",
    steps: [
      {
        stepType: "step",
        instruction: "Check your eligibility",
        description: {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Ensure you meet all eligibility criteria before applying. You must be a Singapore citizen or permanent resident aged 21 and above.",
                },
              ],
            },
          ],
        },
      },
      {
        stepType: "step",
        instruction: "Prepare your documents",
        description: {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Gather your NRIC, income statements, and any supporting documents relevant to your application.",
                },
              ],
            },
          ],
        },
      },
      {
        stepType: "or",
        instruction: "Or apply via MyInfo",
      },
      {
        stepType: "step",
        instruction: "Submit your application online",
        description: {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Log in to LifeSG and complete the online application form. Upload all required documents and review your information carefully before submitting.",
                },
              ],
            },
          ],
        },
      },
      {
        stepType: "and",
        instruction: "And notify your employer",
      },
      {
        stepType: "step",
        instruction: "Await outcome",
        description: {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "You will receive an email notification within 14 working days. Check your Singpass inbox for updates.",
                },
              ],
            },
          ],
        },
      },
    ],
  },
}

export const WithoutTitleOrDescription: Story = {
  args: {
    steps: [
      {
        stepType: "step",
        instruction: "Register on the MySkillsFuture portal",
      },
      {
        stepType: "step",
        instruction: "Select a course from an approved provider",
      },
      {
        stepType: "step",
        instruction: "Complete payment using your SkillsFuture credits",
      },
    ],
  },
}

export const WithImages: Story = {
  args: {
    title: "How to register your child for Primary 1",
    steps: [
      {
        stepType: "step",
        instruction: "Log in to the Primary 1 Registration portal",
        description: {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Use your Singpass to log in to the MOE Primary 1 Registration portal during the registration exercise period.",
                },
              ],
            },
          ],
        },
        imageSrc: "/placeholder_no_image.png",
        imageAlt: "Screenshot of the Primary 1 Registration portal login page",
      },
      {
        stepType: "step",
        instruction: "Select your preferred school",
        imageSrc: "/placeholder_no_image.png",
        imageAlt: "School selection screen on the registration portal",
      },
      {
        stepType: "step",
        instruction: "Submit your registration",
      },
    ],
  },
}

export const LongContent: Story = {
  args: {
    title:
      "A comprehensive guide to applying for the Community Development Grant for Non-Profit Organisations",
    description:
      "This step-by-step guide will walk you through the entire application process for the Community Development Grant. Ensure you read every step carefully before proceeding, as incomplete applications will not be processed.",
    steps: [
      {
        stepType: "step",
        instruction:
          "Verify that your organisation meets all the eligibility criteria set out by the Community Development Council",
        description: {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Your organisation must be registered with the Registry of Societies or incorporated as a company limited by guarantee under the Companies Act.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "The organisation must have been operating for at least two years with a track record of community service delivery.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Annual expenditure must not exceed $5 million in the preceding financial year.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Your proposed project must directly benefit residents in at least one of the five Community Development Council districts.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Applications from organisations that have previously received a grant but failed to submit audited accounts will not be considered.",
                },
              ],
            },
          ],
        },
      },
      {
        stepType: "or",
        instruction: "Or apply as a consortium with a lead organisation",
      },
      {
        stepType: "step",
        instruction:
          "Prepare and compile all required supporting documents as listed in the application checklist",
        description: {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "You will need your organisation's latest audited financial statements, project proposal, and board resolution authorising the application.",
                },
              ],
            },
          ],
        },
      },
      {
        stepType: "and",
        instruction: "And obtain endorsement from your Member of Parliament",
      },
      {
        stepType: "step",
        instruction:
          "Submit the completed application form via the GoBusiness portal before the closing date",
      },
      {
        stepType: "step",
        instruction:
          "Attend the briefing session if shortlisted for further evaluation",
      },
    ],
  },
}

export const Expanded: Story = {
  args: LongContent.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const showMoreButton = canvas.getByText("Show more")
    await userEvent.click(showMoreButton)
  },
}
