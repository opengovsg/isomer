import type { Meta, StoryObj } from "@storybook/react-vite"

import type { MusicProps } from "~/interfaces"
import { Music } from "./Music"

const meta: Meta<MusicProps> = {
  title: "Next/Components/Music",
  component: Music,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Music>

export const SpotifyAlbum: Story = {
  name: "Spotify album",
  args: {
    title: "Spotify album embed",
    url: "https://open.spotify.com/embed/album/6i6folBtxKV28WX3msQ4FE",
  },
}

export const SpotifyTrack: Story = {
  name: "Spotify single track",
  args: {
    title: "Spotify single track embed",
    url: "https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT",
  },
}

export const SpotifyPlaylist: Story = {
  name: "Spotify playlist",
  args: {
    title: "Spotify playlist embed",
    url: "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M",
  },
}

export const SpotifyEpisode: Story = {
  name: "Spotify episode",
  args: {
    title: "Spotify episode embed",
    url: "https://open.spotify.com/embed/episode/7makk4oTQel546B0PZlDM5",
  },
}

export const SpotifyArtist: Story = {
  name: "Spotify artist",
  args: {
    title: "Spotify artist embed",
    url: "https://open.spotify.com/embed/artist/2aaLAng2L2aWD2FClzwiep",
  },
}

export const AppleMusicAlbum: Story = {
  name: "Apple Music album",
  args: {
    title: "Apple Music album embed",
    url: "https://embed.music.apple.com/us/album/magical-mystery-tour/1441163490",
  },
}

export const AppleMusicSong: Story = {
  name: "Apple Music single song",
  args: {
    title: "Apple Music single song embed",
    url: "https://embed.music.apple.com/us/song/hello/1440933467",
  },
}
