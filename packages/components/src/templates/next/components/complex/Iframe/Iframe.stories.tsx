import type { Meta, StoryObj } from "@storybook/react-vite"

import type { IframeProps } from "~/interfaces"
import Iframe from "./Iframe"

const meta: Meta<IframeProps> = {
  title: "Next/Components/Iframe",
  component: Iframe,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Iframe>

export const Youtube: Story = {
  args: {
    content:
      '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=ggGGn4uvFWAIelWD" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
    title: "Rick Astley - Never Gonna Give You Up",
  },
}

export const GoogleSlides: Story = {
  args: {
    content:
      '<iframe src="https://docs.google.com/presentation/d/e/2PACX-1vReIi0KB7Z6X2dDCGoLp__ubrRj3V9CMCM8j66CpFESBaQ5vh6kTa5-2FuMKrWFfSL_-smvsAkvf-Vo/embed?start=false&amp;loop=false&amp;delayms=10000" frameborder="0" width="960" height="569" allowfullscreen="true"></iframe>',
    title: "CalSG - Google Slides",
  },
}

export const GoogleMaps: Story = {
  args: {
    content:
      '<iframe loading="lazy" allowfullscreen="" style="border:0;" height="450" width="600" src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d597.7523002361554!2d103.85029720027245!3d1.297989354553817!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2ssg!4v1704792812823!5m2!1sen!2ssg"></iframe>',
    title: "OGP's office",
  },
}

export const FormSG: Story = {
  args: {
    content:
      '<iframe style="width: 100%; height: 500px" src="https://form.gov.sg/5dc80f7c03b2790012428dc5" id="iframe"></iframe>',
    title: "Isomer Contact Us Form",
  },
}
