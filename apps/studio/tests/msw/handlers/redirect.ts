import { MOCK_STORY_DATE } from "../constants"
import { trpcMsw } from "../mockTrpc"

const DEFAULT_REDIRECT_ITEMS = [
  {
    id: "1",
    source: "/old-about-us",
    destination: "/about",
    publishedAt: MOCK_STORY_DATE,
  },
  {
    id: "2",
    source: "/press-releases",
    destination: "https://www.example.gov.sg/newsroom",
    publishedAt: MOCK_STORY_DATE,
  },
]

export const redirectHandlers = {
  list: {
    default: () => trpcMsw.redirect.list.query(() => DEFAULT_REDIRECT_ITEMS),
    empty: () => trpcMsw.redirect.list.query(() => []),
  },
}
