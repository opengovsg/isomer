import type { Meta, StoryObj } from "@storybook/react-vite"

import type { AudioProps } from "~/interfaces"
import { Audio } from "./Audio"

const meta: Meta<AudioProps> = {
  title: "Next/Components/Audio",
  component: Audio,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Audio>

export const SpotifyEpisode: Story = {
  name: "Spotify episode",
  args: {
    title: "Spotify podcast episode embed",
    url: "https://open.spotify.com/embed/episode/3T5WkragWdHZRwFl7qCHoz?utm_source=generator",
  },
}

export const SpotifyShow: Story = {
  name: "Spotify show",
  args: {
    title: "Spotify podcast show embed",
    url: "https://open.spotify.com/embed/show/66PYiIthr1KqQhJ82XH4DN?utm_source=generator",
  },
}

export const ApplePodcastShow: Story = {
  name: "Apple Podcast show",
  args: {
    title: "BiblioAsia Podcast",
    url: "https://embed.podcasts.apple.com/us/podcast/biblioasia-podcast/id1688142751",
  },
}

export const ApplePodcastEpisode: Story = {
  name: "Apple Podcast episode",
  args: {
    title: "The Days Before Air Conditioning",
    url: "https://embed.podcasts.apple.com/us/podcast/the-days-before-air-conditioning/id1688142751?i=1000739749908",
  },
}
