import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Button, Radio } from "@opengovsg/design-system-react"
import { useAtomValue, useSetAtom } from "jotai"
import { Controller } from "react-hook-form"
import { useCreateAuditLogExportRequest } from "~/features/settings/AuditLogExport/useCreateAuditLogExportRequest"
import { useZodForm } from "~/lib/form"
import {
  AuditLogExportRequestedReportType,
  AuditLogExportScope,
  createAuditLogExportRequestSchema,
  getCurrentSingaporeMonth,
} from "~/schemas/audit"

import {
  DEFAULT_EXPORT_ACCESS_LOGS_MODAL_STATE,
  exportAccessLogsModalAtom,
} from "../atoms"

// Access reports are always a point-in-time snapshot pinned to the current
// month server-side, so this form only ever captures the scope — `month` and
// `reportType` are supplied directly on submit.
const exportAccessLogsFormSchema = createAuditLogExportRequestSchema.omit({
  siteId: true,
  month: true,
  reportType: true,
})

export const ExportAccessLogsModal = () => {
  const { siteId, isOpen } = useAtomValue(exportAccessLogsModalAtom)
  const setModalState = useSetAtom(exportAccessLogsModalAtom)

  const form = useZodForm({
    schema: exportAccessLogsFormSchema,
    defaultValues: { scope: AuditLogExportScope.AllSites },
  })

  const onClose = () => {
    form.reset()
    setModalState(DEFAULT_EXPORT_ACCESS_LOGS_MODAL_STATE)
  }

  // Shared with the settings page's export form: same toasts, same PostHog
  // captures.
  const { mutate: createExportRequest, isPending } =
    useCreateAuditLogExportRequest({ siteId, onSuccess: onClose })

  const onSubmit = form.handleSubmit(({ scope }) =>
    createExportRequest({
      scope,
      siteId,
      month: getCurrentSingaporeMonth(),
      reportType: AuditLogExportRequestedReportType.Access,
    }),
  )

  return (
    <Modal isOpen={!!isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Export access history</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack align="start" spacing="1.5rem">
            <Text textStyle="body-2" color="base.content.default">
              Export a .csv file of who has access to your site as of today.
            </Text>
            <VStack align="start" spacing="0.5rem" w="full">
              <Text textStyle="subhead-1" color="base.content.strong">
                Get access logs for
              </Text>
              <Controller
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <Radio.RadioGroup
                    display="flex"
                    flexDir="column"
                    gap="0.5rem"
                    onChange={field.onChange}
                    value={field.value}
                  >
                    <Radio
                      value={AuditLogExportScope.AllSites}
                      allowDeselect={false}
                    >
                      All sites I have Admin access to
                    </Radio>
                    <Radio
                      value={AuditLogExportScope.Site}
                      allowDeselect={false}
                    >
                      This site only
                    </Radio>
                  </Radio.RadioGroup>
                )}
              />
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="solid" onClick={onSubmit} isLoading={isPending}>
            Export logs
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
