import { useRouter } from "next/router"
import { Flex, Text } from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminLayout } from "~/templates/layouts/AdminLayout"

const GodModePage: NextPageWithLayout = () => {
  const toast = useToast()
  const router = useRouter()
  const isUserIsomerAdmin = useIsUserIsomerAdmin()

  if (!isUserIsomerAdmin) {
    toast({
      title: "You do not have permission to access this page.",
      status: "error",
      ...BRIEF_TOAST_SETTINGS,
    })
    void router.push(`/`)
  }

  return (
    <Flex flexDir="column" py="2rem" maxW="57rem" mx="auto" width="100%">
      <Flex flexDirection="column">
        <Text as="h3" size="lg" textStyle="h3">
          👁️ God Mode 👁️
        </Text>
      </Flex>
    </Flex>
  )
}

GodModePage.getLayout = AdminLayout

export default GodModePage
