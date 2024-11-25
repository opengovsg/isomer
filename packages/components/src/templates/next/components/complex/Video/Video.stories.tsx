import type { Meta, StoryObj } from "@storybook/react"

import type { VideoProps } from "~/interfaces"
import { Video } from "./Video"

const meta: Meta<VideoProps> = {
  title: "Next/Components/Video",
  component: Video,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Video>

export const YouTube: Story = {
  name: "YouTube",
  args: {
    title: "Rick Astley - Never Gonna Give You Up",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ?si=ggGGn4uvFWAIelWD",
  },
}

export const Vimeo: Story = {
  args: {
    title: "WORMWOOD - Animation Short Film 2024 - GOBELINS",
    url: "https://player.vimeo.com/video/984159615?h=945031e683",
  },
}

export const FacebookVideo: Story = {
  args: {
    title: "CLC Lecture: Bringing Town Planning to the Future",
    url: "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FCLCsg%2Fvideos%2F443087086248211%2F&show_text=0&width=560",
  },
}
