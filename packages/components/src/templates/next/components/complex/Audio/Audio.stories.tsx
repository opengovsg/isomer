import type { Meta, StoryObj } from "@storybook/react-vite"
import type { AudioProps } from "~/interfaces"

import { withChromaticModes } from "@isomer/storybook-config"

import { Audio } from "./Audio"

const meta: Meta<AudioProps> = {
  argTypes: {},
  component: Audio,
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/Audio",
}
export default meta
type Story = StoryObj<typeof Audio>

export const SpotifyEpisode: Story = {
  args: {
    title: "Spotify podcast episode embed",
    url: "https://open.spotify.com/embed/episode/3T5WkragWdHZRwFl7qCHoz",
  },
  name: "Spotify episode",
}

export const SpotifyShow: Story = {
  args: {
    title: "Spotify podcast show embed",
    url: "https://open.spotify.com/embed/show/66PYiIthr1KqQhJ82XH4DN",
  },
  name: "Spotify show",
}

export const SpotifyPlaylist: Story = {
  args: {
    title: "NDP playlist",
    url: "https://open.spotify.com/embed/playlist/1apUfsI3NR7LqzFOlGieBT",
  },
  name: "Spotify playlist",
}

export const ApplePodcastShow: Story = {
  args: {
    title: "BiblioAsia Podcast",
    url: "https://embed.podcasts.apple.com/us/podcast/biblioasia-podcast/id1688142751",
  },
  name: "Apple Podcast show",
}

export const ApplePodcastEpisode: Story = {
  args: {
    title: "The Days Before Air Conditioning",
    url: "https://embed.podcasts.apple.com/us/podcast/the-days-before-air-conditioning/id1688142751?i=1000739749908",
  },
  name: "Apple Podcast episode",
}
