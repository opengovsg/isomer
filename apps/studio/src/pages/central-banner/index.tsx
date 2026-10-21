import type { NextPageWithLayout } from "~/lib/types"
import type { CentralNotification } from "~/schemas/global"
import type { RouterOutput } from "~/utils/trpc"
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  FormControl,
  HStack,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Switch, useToast } from "@opengovsg/design-system-react"
import { NotificationCustomSchema } from "@opengovsg/isomer-components"
import { isEqual } from "lodash-es"
import NextLink from "next/link"
import { useRouter } from "next/router"
import { useEffect, useRef, useState } from "react"
import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"
import {
  ACTIONABLE_ERROR_TOAST_SETTINGS,
  BRIEF_TOAST_SETTINGS,
} from "~/constants/toast"
import {
  ErrorProvider,
  useBuilderErrors,
} from "~/features/editing-experience/components/form-builder/ErrorProvider"
import FormBuilder from "~/features/editing-experience/components/form-builder/FormBuilder"
import { centralNotificationValidator } from "~/schemas/global"
import { AuthenticatedLayout } from "~/templates/layouts/AuthenticatedLayout"
import { trpc } from "~/utils/trpc"

type CentralBannerEditorProps = RouterOutput["global"]["getNotification"]

const CentralBannerEditor = ({
  notification: previousNotification,
  version,
}: CentralBannerEditorProps) => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const trpcUtils = trpc.useUtils()
  const { errors, setErrors } = useBuilderErrors()

  const [notification, setNotification] = useState(previousNotification)
  const [snapshot, setSnapshot] = useState(previousNotification)
  const formBuilderChangesEnabledRef = useRef(true)

  const mutation = trpc.global.setNotification.useMutation({
    onSuccess: () => {
      // Refetch for the new version; the editor remounts with it
      void trpcUtils.global.getNotification.invalidate()
      toast({
        title: "Central notification published",
        description: "It may take a few minutes to appear on targeted sites.",
        status: "success",
      })
    },
    onError: (error) => {
      if (error.data?.code === "CONFLICT") {
        toast({
          ...ACTIONABLE_ERROR_TOAST_SETTINGS,
          title: error.message,
          status: "error",
        })
        return
      }

      toast({
        title: "Error publishing central notification!",
        description: `If this persists, please report this issue at ${ISOMER_SUPPORT_EMAIL}`,
        status: "error",
      })
    },
  })

  const bannerOn = notification !== null
  // FormBuilder only forwards valid data, so visible errors must block publish
  const canPublish =
    !isEqual(notification, previousNotification) &&
    Object.keys(errors).length === 0

  const toggleBanner = () => {
    if (bannerOn) {
      // JsonForms can emit a final onChange while unmounting; ignore it so
      // the banner stays off.
      formBuilderChangesEnabledRef.current = false
      setSnapshot(notification)
      setNotification(null)
      setErrors({})
      return
    }

    formBuilderChangesEnabledRef.current = true
    setNotification(snapshot ?? { title: "" })
  }

  return (
    <Box
      mt="1.5rem"
      p="1.5rem"
      bg="base.canvas.default"
      border="1px solid"
      borderColor="base.divider.medium"
      borderRadius="0.5rem"
    >
      <HStack justifyContent="space-between" spacing="1rem">
        <FormControl display="flex" alignItems="center">
          <VStack gap="0.25rem" alignItems="start">
            <Text textStyle="subhead-1" textColor="base.content.strong">
              Display a banner
            </Text>
            <Text textStyle="body-2" textColor="base.content.medium">
              Shown on every targeted site until the visitor dismisses it.
            </Text>
          </VStack>
        </FormControl>
        <Switch
          size="md"
          isChecked={bannerOn}
          onChange={toggleBanner}
          aria-label="Display a banner"
        />
      </HStack>

      {bannerOn && (
        <Box mt="1.25rem">
          <FormBuilder<CentralNotification>
            schema={NotificationCustomSchema}
            validateFn={centralNotificationValidator}
            data={notification}
            handleChange={(data) => {
              if (!formBuilderChangesEnabledRef.current) {
                return
              }
              setNotification(data)
            }}
          />
        </Box>
      )}

      <Flex justifyContent="flex-end" mt="1.5rem">
        <Button
          colorScheme="main"
          size="sm"
          onClick={() => mutation.mutate({ notification, version })}
          isLoading={mutation.isPending}
          isDisabled={!canPublish}
        >
          Publish
        </Button>
      </Flex>
    </Box>
  )
}

const CentralBannerPage: NextPageWithLayout = () => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const router = useRouter()

  const query = trpc.global.getNotification.useQuery()
  // The server checks the feature flag; the client's GrowthBook may not have
  // the user's email attribute yet on first render
  const isForbidden = query.error?.data?.code === "FORBIDDEN"

  useEffect(() => {
    if (!isForbidden) {
      return
    }

    toast({
      title: "You do not have permission to access this page.",
      status: "error",
    })
    void router.push(`/`)
  }, [isForbidden, toast, router])

  const renderBody = () => {
    if (isForbidden || query.isPending) {
      return <Skeleton height="20rem" mt="1.5rem" borderRadius="0.5rem" />
    }

    // Never offer Publish without the saved state: it would overwrite it.
    if (query.isError) {
      return (
        <VStack alignItems="start" mt="1.5rem" gap="0.75rem">
          <Text textStyle="body-2" color="utility.feedback.critical">
            Unable to load the current central notification.
          </Text>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void query.refetch()}
            isLoading={query.isRefetching}
          >
            Retry
          </Button>
        </VStack>
      )
    }

    return (
      <ErrorProvider key={query.data.version ?? ""}>
        <CentralBannerEditor {...query.data} />
      </ErrorProvider>
    )
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

      <Text as="h3" size="lg" textStyle="h3" mt="1rem">
        Central Notification Banner
      </Text>

      <Text textStyle="body-2" color="base.content.medium" mt="0.5rem">
        Manage the notification banner shown across MOE sites.
      </Text>

      {renderBody()}
    </Flex>
  )
}

CentralBannerPage.getLayout = AuthenticatedLayout

export default CentralBannerPage
