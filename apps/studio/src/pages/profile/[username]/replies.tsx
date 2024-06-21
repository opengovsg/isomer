import { Stack, StackDivider } from '@chakra-ui/react'
import Suspense from '~/components/Suspense'
import { type NextPageWithLayout } from '~/lib/types'

export function RepliesPostList(): JSX.Element {
  return <Stack spacing={0} divider={<StackDivider />} py="1rem" />
}

const Replies: NextPageWithLayout = () => {
  return <Suspense fallback={null} />
}

export default Replies
