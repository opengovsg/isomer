import type { Meta, StoryObj } from "@storybook/react-vite"
import type { StepsProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { Steps } from "./Steps"

const meta: Meta<StepsProps> = {
  title: "Next/Components/Steps",
  component: Steps,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    site: generateSiteConfig(),
    headingLevel: 2,
  },
}
export default meta
type Story = StoryObj<StepsProps>

const APPLICATION_STEPS: StepsProps["steps"] = [
  {
    title: "Check if you are eligible",
    description:
      "You must be a Singapore Citizen or Permanent Resident aged 21 and above, and not currently receiving the same support from another agency.",
  },
  {
    title: "Prepare your documents",
    description:
      "You will need your NRIC, proof of income for the past 3 months, and your tenancy agreement if you are renting.",
    buttonLabel: "See the full document checklist",
    buttonUrl: "/faq",
  },
  {
    title: "Submit your application",
    description:
      "Applications are submitted online and take about 15 minutes to complete.",
    buttonLabel: "Start your application",
    buttonUrl: "https://form.gov.sg",
  },
  {
    title: "Wait for the outcome",
    description:
      "We will email you the outcome within 4 weeks. You can check your application status at any time.",
  },
]

// The three number treatments being compared. Everything else is held constant
// so the only difference on screen is the number.
export const LargeNumeral: Story = {
  args: {
    title: "How to apply",
    subtitle:
      "Applying takes about 15 minutes. Have your documents ready before you start.",
    numberStyle: "numeral",
    steps: APPLICATION_STEPS,
  },
}

export const SmallEyebrow: Story = {
  args: {
    ...LargeNumeral.args,
    numberStyle: "eyebrow",
  },
}

export const FilledBadge: Story = {
  args: {
    ...LargeNumeral.args,
    numberStyle: "badge",
  },
}

export const ThreeSteps: Story = {
  args: {
    title: "Switching to Isomer is as easy as 1-2-3",
    subtitle: "Most agencies are up and running within a month.",
    numberStyle: "badge",
    steps: APPLICATION_STEPS.slice(0, 3),
  },
}

// Wraps to 3 + 1. Three to a row is the cap, so the fourth step starts a new
// row rather than squeezing a fourth column.
export const FourSteps: Story = {
  args: {
    ...LargeNumeral.args,
  },
}

// Wraps to 3 + 2.
export const FiveSteps: Story = {
  args: {
    title: "From enquiry to launch",
    subtitle: "What to expect at each stage of onboarding.",
    numberStyle: "numeral",
    steps: [
      ...APPLICATION_STEPS,
      {
        title: "Receive your payout",
        description:
          "Approved applicants receive the first payout within 10 working days.",
      },
    ],
  },
}

// The maximum: two even rows of 3.
export const SixSteps: Story = {
  args: {
    title: "From enquiry to launch",
    subtitle: "What to expect at each stage of onboarding.",
    numberStyle: "numeral",
    steps: [
      ...APPLICATION_STEPS,
      {
        title: "Receive your payout",
        description:
          "Approved applicants receive the first payout within 10 working days.",
      },
      {
        title: "Renew before the year ends",
        description:
          "Support runs for 12 months. We will remind you a month before it lapses.",
      },
    ],
  },
}

export const LongContent: Story = {
  args: {
    title:
      "How to apply for the Enhanced Support Scheme for Lower-Income Households",
    subtitle:
      "This scheme replaces three earlier schemes. If you were receiving support under any of those, you do not need to reapply — your support continues automatically until the end of the transition period.",
    numberStyle: "eyebrow",
    steps: [
      {
        title:
          "Check whether you meet the household income and property ownership criteria",
        description:
          "Your household monthly income per person must not exceed $1,500, and you must not own more than one property. Household income includes the income of everyone living at the same registered address, including family members who are not applying.",
        buttonLabel: "Use the eligibility checker",
        buttonUrl: "/faq",
      },
      {
        title: "Gather supporting documents for everyone in your household",
        description:
          "You will need the NRIC of every household member, payslips or CPF contribution history for the past 3 months, and a copy of your tenancy agreement or property title deed.",
      },
      {
        title: "Submit online",
        description: "Takes about 15 minutes.",
        buttonLabel: "Apply now",
        buttonUrl: "https://form.gov.sg",
      },
    ],
  },
}

// Steps commonly have no link at all — the sequence is the content.
export const NoLinks: Story = {
  args: {
    title: "What happens after you report a fallen tree",
    numberStyle: "numeral",
    steps: [
      {
        title: "We acknowledge your report",
        description: "You receive a case number by SMS within 30 minutes.",
      },
      {
        title: "An officer assesses the site",
        description:
          "We aim to inspect within 24 hours, or sooner if the tree is blocking a road.",
      },
      {
        title: "We clear the tree",
        description:
          "Clearance usually happens on the same day as the inspection.",
      },
    ],
  },
}

export const MinimumTwoSteps: Story = {
  args: {
    title: "Renewing your licence",
    numberStyle: "badge",
    steps: APPLICATION_STEPS.slice(0, 2),
  },
}
