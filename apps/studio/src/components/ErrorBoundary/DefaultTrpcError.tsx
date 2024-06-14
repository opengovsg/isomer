import { Box } from '@chakra-ui/react'
import { type TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc'
import { useEffect } from 'react'
import { trpc } from '~/utils/trpc'
import { UnexpectedErrorCard } from './UnexpectedErrorCard'
import { FullscreenSpinner } from '../FullscreenSpinner'

function UnauthorizedError() {
  const utils = trpc.useUtils()
  useEffect(() => {
    void utils.invalidate()
  }, [utils])

  return <FullscreenSpinner />
}

// TODO: Make custom components for these
export function DefaultTrpcError({ code }: { code: TRPC_ERROR_CODE_KEY }) {
  switch (code) {
    case 'NOT_FOUND':
      return (
        <Box bgColor="red" width="100px" height="100px">
          Not found!
        </Box>
      )

    case 'UNAUTHORIZED':
      return <UnauthorizedError />

    default:
      return <UnexpectedErrorCard />
  }
}
