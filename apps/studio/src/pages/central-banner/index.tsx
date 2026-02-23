import { useState } from "react"
import NextLink from "next/link"
import { useRouter } from "next/router"
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  IconButton,
  Skeleton,
  Text,
} from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import { NotificationSettingsSchema } from "@opengovsg/isomer-components"
import { BiPlus, BiTrash } from "react-icons/bi"

import type { NextPageWithLayout } from "~/lib/types"
import type { Notification } from "~/schemas/site"
import { ISOMER_SUPPORT_EMAIL, MOE_SITES } from "~/constants/misc"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { ErrorProvider } from "~/features/editing-experience/components/form-builder/ErrorProvider"
import FormBuilder from "~/features/editing-experience/components/form-builder/FormBuilder"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { ADMIN_ROLE } from "~/lib/growthbook"
import { notificationValidator } from "~/schemas/site"
import { AuthenticatedLayout } from "~/templates/layouts/AuthenticatedLayout"
import { trpc } from "~/utils/trpc"

interface NotificationEntry {
  notification: Notification
  targetSites: string[]
}

const EMPTY_ENTRY: NotificationEntry = {
  notification: {},
  targetSites: [],
}

const CentralBannerPage: NextPageWithLayout = () => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const router = useRouter()
  const trpcUtils = trpc.useUtils()

  // TODO: Change this to a feature flag to allow other users to access
  const isEnabled = useIsUserIsomerAdmin({
    roles: [ADMIN_ROLE.CORE],
  })

  if (!isEnabled) {
    toast({
      title: "You do not have permission to access this page.",
      status: "error",
    })
    void router.push(`/`)
  }

  const { data: existingEntries, isLoading } =
    trpc.global.getNotification.useQuery(undefined, {
      enabled: isEnabled,
    })

  const [entries, setEntries] = useState<NotificationEntry[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize state from server data once loaded
  if (existingEntries && !isInitialized) {
    setEntries(
      existingEntries.map((entry) => ({
        notification: (entry.notification
          ? { notification: entry.notification }
          : {}) as Notification,
        targetSites: entry.targetSites,
      })),
    )
    setIsInitialized(true)
  }

  const mutation = trpc.global.setNotification.useMutation({
    onSuccess: () => {
      void trpcUtils.global.getNotification.invalidate()
      toast({
        title: "Central notification published",
        description: "Changes are live immediately on all targeted sites.",
        status: "success",
      })
    },
    onError: () => {
      toast({
        title: "Error publishing central notification!",
        description: `If this persists, please report this issue at ${ISOMER_SUPPORT_EMAIL}`,
        status: "error",
      })
    },
  })

  const handleAddEntry = () => {
    setEntries((prev) => [...prev, { ...EMPTY_ENTRY }])
  }

  const handleRemoveEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  const handleNotificationChange = (index: number, data: Notification) => {
    setEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, notification: data } : entry,
      ),
    )
  }

  const handleSubmit = () => {
    const payload = entries
      .filter((entry) => entry.notification.notification?.title)
      .map((entry) => ({
        notification: entry.notification.notification!,
        targetSites: MOE_SITES,
      }))

    mutation.mutate({ entries: payload })
  }

  return (
    <Flex flexDir="column" py="2rem" maxW="57rem" mx="auto" width="100%">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" as={NextLink}>
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Central Notification Banner</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Flex justifyContent="space-between" alignItems="center" mt="1rem">
        <Text as="h3" size="lg" textStyle="h3">
          Central Notification Banner
        </Text>
        <Flex gap="0.5rem">
          <Button
            colorScheme="main"
            size="sm"
            onClick={handleSubmit}
            isLoading={mutation.isPending}
          >
            Publish
          </Button>
        </Flex>
      </Flex>

      <Text textStyle="body-2" color="base.content.medium" mt="0.5rem">
        Manage notification banners that are displayed across multiple sites.
        Each notification targets a specific set of sites. A site will show at
        most one notification (the first matching entry).
      </Text>

      {isLoading ? (
        <Skeleton height="20rem" mt="1.5rem" borderRadius="0.5rem" />
      ) : (
        <Flex flexDirection="column" mt="1.5rem" gap="1.5rem">
          {entries.map((entry, index) => (
            <Box
              key={index}
              p="1.5rem"
              bg="base.canvas.default"
              border="1px solid"
              borderColor="base.divider.medium"
              borderRadius="0.5rem"
            >
              <Flex
                justifyContent="space-between"
                alignItems="center"
                mb="1rem"
              >
                <Text textStyle="subhead-1">Notification {index + 1}</Text>
                <IconButton
                  aria-label="Remove notification entry"
                  icon={<BiTrash />}
                  variant="outline"
                  colorScheme="critical"
                  size="sm"
                  onClick={() => handleRemoveEntry(index)}
                />
              </Flex>

              <ErrorProvider>
                <FormBuilder<Notification>
                  schema={NotificationSettingsSchema}
                  validateFn={notificationValidator}
                  data={entry.notification}
                  handleChange={(data) => handleNotificationChange(index, data)}
                />
              </ErrorProvider>
            </Box>
          ))}

          <Button
            leftIcon={<BiPlus />}
            variant="outline"
            onClick={handleAddEntry}
            width="fit-content"
          >
            Add notification
          </Button>
        </Flex>
      )}
    </Flex>
  )
}

CentralBannerPage.getLayout = AuthenticatedLayout

export default CentralBannerPage
