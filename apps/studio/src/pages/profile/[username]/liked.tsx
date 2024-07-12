import { Stack, StackDivider } from "@chakra-ui/react"

import Suspense from "~/components/Suspense"
import { type NextPageWithLayout } from "~/lib/types"

export function LikedPostList(): JSX.Element {
  return <Stack spacing={0} divider={<StackDivider />} py="1rem" />
}

const Liked: NextPageWithLayout = () => {
  return (
    <Suspense fallback={null}>
      <LikedPostList />
    </Suspense>
  )
}

export default Liked
