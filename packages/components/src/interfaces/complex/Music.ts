import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { MUSIC_EMBED_URL_PATTERN } from "~/utils/validation"

export const MusicSchema = Type.Object(
  {
    type: Type.Literal("music", { default: "music" }),
    url: Type.String({
      title: "Music to embed",
      description:
        "Spotify or Apple Podcast embed URL (album, track, episode, playlist, show, etc.)",
      pattern: MUSIC_EMBED_URL_PATTERN,
      format: "embed",
    }),
    title: Type.String({
      title: "Label for screen readers",
      description:
        "This is not shown on the page, but is compulsory for accessibility",
    }),
  },
  {
    title: "Music",
    description:
      "The music component is used to embed Spotify or Apple Podcast content: single songs/tracks, episodes, albums, playlists, or podcast shows within the current page.",
  },
)

export type MusicProps = Static<typeof MusicSchema> & {
  shouldLazyLoad?: boolean
}
