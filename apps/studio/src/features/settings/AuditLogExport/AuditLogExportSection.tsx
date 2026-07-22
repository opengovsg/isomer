import { Box, FormControl, Stack, Text } from "@chakra-ui/react"
import {
  Button,
  FormErrorMessage,
  FormLabel,
  SingleSelect,
  useToast,
} from "@opengovsg/design-system-react"
import { useContext, useMemo } from "react"
import { Controller } from "react-hook-form"
import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { UserManagementContext } from "~/features/users"
import { useZodForm } from "~/lib/form"
import { AuditLogExportRequestedReportType } from "~/schemas/audit"
import { trpc } from "~/utils/trpc"

import { auditLogExportFormSchema } from "./schema"
import { getMonthOptions } from "./utils"

interface AuditLogExportSectionProps {
  siteId: number
}

const REPORT_TYPE_OPTIONS = [
  { value: AuditLogExportRequestedReportType.Access, label: "Access report" },
  {
    value: AuditLogExportRequestedReportType.Activity,
    label: "Activity report",
  },
  { value: AuditLogExportRequestedReportType.Both, label: "Both" },
]

export const AuditLogExportSection = ({
  siteId,
}: AuditLogExportSectionProps): JSX.Element | null => {
  const ability = useContext(UserManagementContext)
  const canManageUsers = ability.can("manage", "UserManagement")

  const toast = useToast(BRIEF_TOAST_SETTINGS)

  const monthOptions = useMemo(() => getMonthOptions(), [])

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useZodForm({
    schema: auditLogExportFormSchema,
    defaultValues: {
      // Default to the most recent month on offer (the current, partial month).
      month: monthOptions[0]?.value,
      reportType: AuditLogExportRequestedReportType.Both,
    },
  })

  const { mutate: createExportRequest, isPending } =
    trpc.audit.createExportRequest.useMutation({
      onSuccess: () => {
        reset()
        toast({
          title: "Export requested",
          description:
            "Your export is being generated. We'll email you a download link when it's ready.",
          status: "success",
        })
      },
      // The server returns typed, user-facing messages for the expected
      // rejections (future month, not an admin). Duplicate requests never
      // fail — they are accepted idempotently. Surface server messages
      // directly; fall back to a generic message for anything else.
      onError: (error) => {
        if (error.data?.code === "FORBIDDEN") {
          toast({
            title: "You don't have permission to export audit logs",
            description: "Only site admins can request an audit log export.",
            status: "error",
          })
          return
        }

        toast({
          title: "Couldn't request export",
          description:
            error.message ||
            `If this persists, please report this issue at ${ISOMER_SUPPORT_EMAIL}`,
          status: "error",
        })
      },
    })

  if (!canManageUsers) return null

  const onSubmit = ({
    month,
    reportType,
  }: {
    month: string
    reportType: (typeof REPORT_TYPE_OPTIONS)[number]["value"]
  }) => {
    createExportRequest({ siteId, month, reportType })
  }

  return (
    <Box
      borderWidth="1px"
      borderRadius="0.5rem"
      p="1.25rem"
      bgColor="base.canvas.default"
    >
      <Text textStyle="subhead-1" mb="0.25rem">
        Audit log export
      </Text>
      <Text textStyle="body-2" color="base.content.medium" mb="1.25rem">
        Download an audit log export for this site. You'll receive an email with
        a download link.
      </Text>

      <Stack
        as="form"
        spacing="1rem"
        align="flex-start"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormControl isInvalid={!!errors.month} isRequired>
          <FormLabel>Month</FormLabel>
          <Controller
            name="month"
            control={control}
            render={({ field: { value, onChange, ...rest } }) => (
              <SingleSelect
                {...rest}
                value={value ?? ""}
                onChange={onChange}
                items={monthOptions}
                isClearable={false}
              />
            )}
          />
          <FormErrorMessage>{errors.month?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.reportType} isRequired>
          <FormLabel>Report type</FormLabel>
          <Controller
            name="reportType"
            control={control}
            render={({ field: { value, onChange, ...rest } }) => (
              <SingleSelect
                {...rest}
                value={value ?? ""}
                onChange={onChange}
                items={REPORT_TYPE_OPTIONS}
                isClearable={false}
              />
            )}
          />
          <FormErrorMessage>{errors.reportType?.message}</FormErrorMessage>
        </FormControl>

        <Button type="submit" isLoading={isPending}>
          Request export
        </Button>
      </Stack>
    </Box>
  )
}
