import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  Text,
} from "@chakra-ui/react"
import { Textarea, useToast } from "@opengovsg/design-system-react"
import NextLink from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { ADMIN_ROLE } from "~/lib/growthbook"
import { type NextPageWithLayout } from "~/lib/types"
import { AuthenticatedLayout } from "~/templates/layouts/AuthenticatedLayout"
import { trpc } from "~/utils/trpc"

const GodModeWhitelistPage: NextPageWithLayout = () => {
  const toast = useToast()
  const router = useRouter()
  const isUserIsomerAdmin = useIsUserIsomerAdmin({
    roles: [ADMIN_ROLE.CORE, ADMIN_ROLE.MIGRATORS],
  })

  const [vendorEmails, setVendorEmails] = useState<string[]>([])
  const [adminEmails, setAdminEmails] = useState<string[]>([])

  const whitelistMutation = trpc.whitelist.whitelistEmails.useMutation({
    onSuccess: (data) => {
      toast({
        title: `Successfully whitelisted ${data.adminCount} admin(s) and ${data.vendorCount} vendor(s)`,
        status: "success",
        ...BRIEF_TOAST_SETTINGS,
      })
      setAdminEmails([])
      setVendorEmails([])
    },
    onError: (error) => {
      toast({
        title: error.message,
        status: "error",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  useEffect(() => {
    if (!isUserIsomerAdmin) {
      toast({
        title: "You do not have permission to access this page.",
        status: "error",
        ...BRIEF_TOAST_SETTINGS,
      })
      void router.push(`/`)
    }
  }, [isUserIsomerAdmin, router, toast])

  if (!isUserIsomerAdmin) {
    return null
  }

  return (
    <Flex flexDir="column" py="2rem" maxW="57rem" mx="auto" width="100%">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" as={NextLink}>
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="/godmode" as={NextLink}>
            👁️ God Mode 👁️
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Text as="h3" size="lg" textStyle="h3">
        Whitelist
      </Text>

      <Box mt={8} bg="white" borderRadius="md" p={4}>
        <Text fontWeight="bold" mb={4}>
          What happens when you whitelist an email?
        </Text>
        <Text>
          The user with the given email will be able to log into Isomer Studio.
          If the user is given vendor access, the email will only be whitelisted
          for 90 days. Input each email on a new line.
          <br /> <br /> If you want to whitelist multiple users at once, you can
          copy and paste a list of emails here. The system will automatically
          remove any duplicate emails before processing.
        </Text>
      </Box>

      <Flex flexDir="column" mt={8} bg="white" borderRadius="md" p={4} gap={4}>
        <h1>
          <b>No expiry</b>
        </h1>
        <Textarea
          value={adminEmails.join("\n")}
          onChange={(e) => {
            const newEmails = e.target.value.split(/\r?\n/).map((s) => s.trim())
            setAdminEmails(newEmails)
          }}
        />
        <h1>
          <b>Vendors (90 day expiry)</b>
        </h1>
        <Textarea
          value={vendorEmails.join("\n")}
          onChange={(e) => {
            const newEmails = e.target.value.split(/\r?\n/).map((s) => s.trim())
            setVendorEmails(newEmails)
          }}
        />
        <Button
          onClick={() => {
            whitelistMutation.mutate({
              adminEmails,
              vendorEmails,
            })
          }}
          isLoading={whitelistMutation.isPending}
        >
          Submit
        </Button>
      </Flex>
    </Flex>
  )
}

GodModeWhitelistPage.getLayout = AuthenticatedLayout

export default GodModeWhitelistPage
