import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { z } from "zod"
import {
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  Button,
  ModalCloseButton,
  useToast,
} from "@opengovsg/design-system-react"
import { format } from "date-fns"
import posthog from "posthog-js"
import { useEffect, useState } from "react"
import { FormProvider, useFormContext } from "react-hook-form"
import { BiHourglass } from "react-icons/bi"
import { parseTimeStringToDate } from "~/components/Select/TimeSelect"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { getTimezoneAbbreviation } from "~/lib/dates"
import { useZodForm } from "~/lib/form"
import { schedulePublishClientSchema } from "~/schemas/schedule"
import { trpc } from "~/utils/trpc"

import type { PublishMode } from "./PublishOptionsInput"
import { PUBLISHED_AFTER_EDITING_EVENT } from "../../constants"
import { useFireContentEditSurveyEvent } from "../../hooks/useContentEditSurvey"
import { PublishOptionsInput } from "./PublishOptionsInput"
import { SchedulePublishDetails } from "./ScheduledPublishDetails"

interface PublishModalProps extends UseDisclosureReturn {
  pageId: number
  siteId: number
}

export const PublishModal = ({
  pageId,
  siteId,
  onClose,
  ...rest
}: PublishModalProps): JSX.Element => {
  const toast = useToast()
  const utils = trpc.useUtils()
  const fireContentEditSurveyEvent = useFireContentEditSurveyEvent()
  const [mode, setMode] = useState<PublishMode | undefined>(undefined)
  const [isScheduledPublishValid, setIsScheduledPublishValid] = useState(false)

  const methods = useZodForm<typeof schedulePublishClientSchema>({
    schema: schedulePublishClientSchema,
    defaultValues: {
      pageId,
      siteId,
    },
  })

  // Validate the schedule form as it changes so the info banner can be shown
  // once it's complete. Do NOT use trigger() since that surfaces error messages.
  useEffect(() => {
    const validateForm = () => {
      const valid = schedulePublishClientSchema.safeParse(methods.getValues())
      setIsScheduledPublishValid(valid.success)
    }
    const subscription = methods.watch(() => validateForm())
    return () => subscription.unsubscribe()
  }, [methods])

  const invalidateAfterMutation = () =>
    Promise.all([
      utils.page.readPage.refetch({ pageId, siteId }),
      utils.site.getLocalisedSitemap.invalidate({
        resourceId: pageId,
        siteId,
      }),
      // Publishing changes this resource's liveStatus, which the dashboard
      // tables/index-page row derive from — refresh whichever of these is
      // currently mounted (folder, collection item list, or index page).
      utils.resource.listWithoutRoot.invalidate(),
      utils.collection.list.invalidate(),
      utils.folder.getIndexpage.invalidate(),
    ])

  const { mutate: publishNow, isPending: isPublishingNow } =
    trpc.page.publishPage.useMutation({
      onSettled: () => {
        void invalidateAfterMutation()
        onClose()
      },
      onSuccess: () => {
        posthog.capture("page_published", { site_id: siteId })
        fireContentEditSurveyEvent(PUBLISHED_AFTER_EDITING_EVENT)
        toast({
          status: "success",
          title: "Page published successfully",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
      onError: (error) => {
        console.error(`Error occurred when publishing page: ${error.message}`)
        // The publish-block throws CONFLICT with an actionable message naming
        // the redirect to remove — surface it verbatim, not the generic
        // failure copy.
        toast({
          status: "error",
          title:
            error.data?.code === "CONFLICT"
              ? error.message
              : "Failed to publish page. Please contact Isomer support.",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
    })

  const { mutate: schedulePageMutation, isPending: isScheduling } =
    trpc.page.schedulePage.useMutation({
      onSettled: () => {
        void invalidateAfterMutation()
        onClose()
      },
      onSuccess: () => {
        fireContentEditSurveyEvent(PUBLISHED_AFTER_EDITING_EVENT)
        toast({
          status: "success",
          title: "Page scheduled successfully",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
      onError: (error) => {
        console.error(`Error occurred when scheduling page: ${error.message}`)
        toast({
          status: "error",
          title: "Failed to schedule page. Please contact Isomer support.",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
    })

  const isSubmitting = isPublishingNow || isScheduling

  const handleSubmitClick = () => {
    if (mode === "now") {
      publishNow({ pageId, siteId })
    } else if (mode === "later") {
      void methods.handleSubmit(
        (res: z.output<typeof schedulePublishClientSchema>) =>
          schedulePageMutation(res),
      )()
    }
  }

  return (
    <Modal onClose={onClose} {...rest}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Publish this page?</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <FormProvider {...methods}>
            <VStack align="stretch" spacing="1rem">
              <PublishOptionsInput
                value={mode}
                onChange={(value) => setMode(value as PublishMode)}
              />
              {mode === "later" && (
                <VStack align="stretch" spacing="1.5rem">
                  <SchedulePublishDetails />
                  {isScheduledPublishValid && <SchedulePublishBanner />}
                </VStack>
              )}
            </VStack>
          </FormProvider>
        </ModalBody>
        <ModalFooter>
          <Button
            mr={3}
            onClick={onClose}
            variant="clear"
            color="base.content.strong"
          >
            No, don't publish
          </Button>
          <Button
            onClick={handleSubmitClick}
            isDisabled={!mode}
            isLoading={isSubmitting}
          >
            {mode === "later" ? "Schedule publish" : "Publish now"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

const SchedulePublishBanner = () => {
  const { getValues } =
    useFormContext<z.input<typeof schedulePublishClientSchema>>()
  return (
    <HStack
      spacing="0.5rem"
      alignItems="flex-start"
      bgColor="utility.feedback.info-subtle"
      borderRadius="0.25rem"
      p="0.75rem"
    >
      <Icon as={BiHourglass} boxSize="1rem" color="base.content.default" />
      <Text textStyle="body-2" color="base.content.strong" display="inline">
        We will publish this page at{" "}
        <Text display="inline" textStyle="subhead-2">
          {format(parseTimeStringToDate(getValues("publishTime")), "hh:mm a")}
        </Text>
        , {getTimezoneAbbreviation("long")}, on{" "}
        <Text display="inline" textStyle="subhead-2">
          {format(getValues("publishDate"), "MMMM d, yyyy")}
        </Text>
        . Changes will be live on your site approximately 5-10 minutes after
        publishing.
      </Text>
    </HStack>
  )
}
