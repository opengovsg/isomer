import type { UseDisclosureReturn } from "@chakra-ui/react"
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
import { add } from "date-fns"
import posthog from "posthog-js"
import { useState } from "react"
import { FormProvider } from "react-hook-form"
import { BiSolidInfoCircle } from "react-icons/bi"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useZodForm } from "~/lib/form"
import {
  MINIMUM_SCHEDULE_LEAD_TIME_MINUTES,
  schedulePublishClientSchema,
  scheduleUnpublishClientSchema,
} from "~/schemas/schedule"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { ActionMode, PublishOrUnpublishAction } from "./ActionOptionsInput"
import { PUBLISHED_AFTER_EDITING_EVENT } from "../../constants"
import { useFireContentEditSurveyEvent } from "../../hooks/useContentEditSurvey"
import { ActionOptionsInput } from "./ActionOptionsInput"
import { ScheduleBanner } from "./ScheduleBanner"
import { ScheduleDateTimeFields } from "./ScheduleDateTimeFields"

interface PublishOrUnpublishModalProps extends UseDisclosureReturn {
  action: PublishOrUnpublishAction
  pageId: number
  siteId: number
  // Unpublish-only: whether the page has unsaved draft changes on top of its
  // published version.
  hasDraftChanges?: boolean
  // Unpublish-only: set when this is a Folder/Collection's landing page —
  // scheduling an unpublish here also requires its child pages to be
  // unpublished by then. Undefined when this page isn't a container landing
  // page at all.
  containerType?: ResourceType
  // Unpublish-only: set when "now" isn't a valid choice — some other
  // currently-live page inside this container has no unpublish scheduled at
  // all, so an immediate unpublish would fail server-side. Scheduling is
  // still offered: once every live descendant has its own unpublish
  // scheduled, picking a date on/after the latest one will succeed (checked
  // for real against the chosen date when the schedule mutation runs).
  disableNow?: boolean
}

const FIELD_NAMES: Record<
  PublishOrUnpublishAction,
  { date: string; time: string }
> = {
  publish: { date: "publishDate", time: "publishTime" },
  unpublish: { date: "unpublishDate", time: "unpublishTime" },
}

export const PublishOrUnpublishModal = ({
  action,
  pageId,
  siteId,
  hasDraftChanges = false,
  containerType,
  disableNow = false,
  onClose,
  ...rest
}: PublishOrUnpublishModalProps): JSX.Element => {
  const toast = useToast()
  const utils = trpc.useUtils()
  const fireContentEditSurveyEvent = useFireContentEditSurveyEvent()
  // Skip straight to "later" when "now" isn't an option — there's nothing
  // else to pick.
  const [mode, setMode] = useState<ActionMode | undefined>(
    disableNow ? "later" : undefined,
  )

  const schema =
    action === "publish"
      ? schedulePublishClientSchema
      : scheduleUnpublishClientSchema
  const { date: dateField, time: timeField } = FIELD_NAMES[action]

  // Both schemas differ in shape (publishDate/publishTime vs unpublishDate/
  // unpublishTime), so this can't be typed as a single concrete schema — it's
  // deliberately loose here in exchange for the two flows sharing one modal.
  const methods = useZodForm<typeof schedulePublishClientSchema>({
    schema: schema as typeof schedulePublishClientSchema,
    defaultValues: { pageId, siteId },
  })

  const invalidateAfterMutation = () =>
    Promise.all([
      utils.page.readPage.refetch({ pageId, siteId }),
      utils.site.getLocalisedSitemap.invalidate({
        resourceId: pageId,
        siteId,
      }),
      // Publishing/unpublishing changes this resource's liveStatus, which the
      // dashboard tables/index-page row derive from — refresh whichever of
      // these is currently mounted (folder, collection item list, or index
      // page).
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
        // the redirect to remove; guards like the scheduled-unpublish
        // ancestor lock throw PRECONDITION_FAILED — surface both verbatim
        // rather than the generic failure copy.
        toast({
          status: "error",
          title:
            error.data?.code === "CONFLICT" ||
            error.data?.code === "PRECONDITION_FAILED"
              ? error.message
              : "Failed to publish page. Please contact Isomer support.",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
    })

  const { mutate: schedulePageMutation, isPending: isSchedulingPublish } =
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
        // The scheduled-unpublish ancestor lock (and similar guards) throws
        // PRECONDITION_FAILED with an actionable message — surface it
        // verbatim rather than the generic failure copy.
        toast({
          status: "error",
          title:
            error.data?.code === "PRECONDITION_FAILED"
              ? error.message
              : "Failed to schedule page. Please contact Isomer support.",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
    })

  const { mutate: unpublishNow, isPending: isUnpublishingNow } =
    trpc.page.unpublishPage.useMutation({
      onSettled: () => {
        void invalidateAfterMutation()
        onClose()
      },
      onSuccess: () => {
        toast({
          status: "success",
          title: "Page unpublished successfully",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
      onError: (error) => {
        console.error(`Error occurred when unpublishing page: ${error.message}`)
        // Guards like "other pages inside are still live" throw
        // PRECONDITION_FAILED with an actionable message — surface it
        // verbatim rather than the generic failure copy.
        toast({
          status: "error",
          title:
            error.data?.code === "PRECONDITION_FAILED"
              ? error.message
              : "Failed to unpublish page. Please contact Isomer support.",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
    })

  const {
    mutate: scheduleUnpublishMutation,
    isPending: isSchedulingUnpublish,
  } = trpc.page.scheduleUnpublish.useMutation({
    onSettled: () => {
      void invalidateAfterMutation()
      onClose()
    },
    onSuccess: () => {
      toast({
        status: "success",
        title: "Page scheduled to unpublish successfully",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
    onError: (error) => {
      console.error(
        `Error occurred when scheduling unpublish: ${error.message}`,
      )
      // The "child pages won't be unpublished in time" guard throws
      // PRECONDITION_FAILED with an actionable message — surface it
      // verbatim rather than the generic failure copy.
      toast({
        status: "error",
        title:
          error.data?.code === "PRECONDITION_FAILED"
            ? error.message
            : "Failed to schedule page unpublish. Please contact Isomer support.",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const isSubmitting =
    isPublishingNow ||
    isSchedulingPublish ||
    isUnpublishingNow ||
    isSchedulingUnpublish

  const handleSubmitClick = () => {
    if (mode === "now") {
      if (action === "publish") {
        publishNow({ pageId, siteId })
      } else {
        unpublishNow({ pageId, siteId })
      }
    } else if (mode === "later") {
      void methods.handleSubmit((res) => {
        if (action === "publish") {
          schedulePageMutation(res)
        } else {
          scheduleUnpublishMutation(res)
        }
      })()
    }
  }

  const earliestSchedule = add(new Date(), {
    minutes: MINIMUM_SCHEDULE_LEAD_TIME_MINUTES,
  })

  // Calling watch() with no args during render (not inside an effect)
  // subscribes this component to every field change, same as useWatch would.
  // Feeding that straight into the schema gives us both "is the schedule
  // complete" and the combined date in one place, instead of tracking
  // validity as separate state and reassembling the date by hand — the
  // schema's own transform already does that.
  const parsedSchedule = schema.safeParse(methods.watch())
  const scheduledAt = parsedSchedule.success
    ? parsedSchedule.data.scheduledAt
    : null

  return (
    <Modal onClose={onClose} {...rest}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">
          {action === "publish" ? "Publish this page?" : "Unpublish this page?"}
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <FormProvider {...methods}>
            <VStack align="stretch" spacing="1rem">
              <ActionOptionsInput
                action={action}
                value={mode}
                onChange={(value) => setMode(value as ActionMode)}
                disableNowReason={
                  disableNow
                    ? "Other pages inside are still live with no unpublish scheduled. Unpublish or schedule those first, or schedule this for later."
                    : undefined
                }
              />
              {mode === "later" && (
                <VStack align="stretch" spacing="1rem">
                  <ScheduleDateTimeFields
                    dateField={dateField}
                    timeField={timeField}
                    earliestSchedule={earliestSchedule}
                  />
                  {action === "unpublish" && containerType && (
                    <ChildPagesDisclaimerBanner containerType={containerType} />
                  )}
                  {scheduledAt && (
                    <ScheduleBanner action={action} scheduledAt={scheduledAt} />
                  )}
                </VStack>
              )}
              {action === "unpublish" && hasDraftChanges && (
                <DraftChangesBanner />
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
            {action === "publish" ? "No, don't publish" : "No, don't unpublish"}
          </Button>
          <Button
            onClick={handleSubmitClick}
            isDisabled={!mode}
            isLoading={isSubmitting}
          >
            {mode === "later"
              ? action === "publish"
                ? "Schedule publish"
                : "Schedule unpublish"
              : action === "publish"
                ? "Publish now"
                : "Unpublish now"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

const DraftChangesBanner = () => (
  <HStack
    spacing="0.5rem"
    alignItems="flex-start"
    bgColor="utility.feedback.info-subtle"
    borderRadius="0.25rem"
    p="0.75rem"
  >
    <Icon
      as={BiSolidInfoCircle}
      boxSize="1rem"
      color="utility.feedback.info"
      mt="0.125rem"
    />
    <Text textStyle="body-2" color="base.content.strong" display="inline">
      <Text as="span" textStyle="subhead-2">
        This page has unsaved draft changes.
      </Text>{" "}
      They'll be kept, and you can keep editing and publish them later.
    </Text>
  </HStack>
)

const ChildPagesDisclaimerBanner = ({
  containerType,
}: {
  containerType: ResourceType
}) => {
  const label =
    containerType === ResourceType.Collection ? "collection" : "folder"
  return (
    <HStack
      spacing="0.5rem"
      alignItems="flex-start"
      bgColor="utility.feedback.info-subtle"
      borderRadius="0.25rem"
      p="0.75rem"
    >
      <Icon
        as={BiSolidInfoCircle}
        boxSize="1rem"
        color="utility.feedback.info"
        mt="0.125rem"
      />
      <Text textStyle="body-2" color="base.content.strong">
        This {label}'s child pages must also be unpublished by this time.
      </Text>
    </HStack>
  )
}
