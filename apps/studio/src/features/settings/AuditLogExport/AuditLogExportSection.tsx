import {
  Box,
  Center,
  Flex,
  FormControl,
  HStack,
  Icon,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react"
import {
  Button,
  FormErrorMessage,
  Infobox,
  SingleSelect,
  TouchableTooltip,
} from "@opengovsg/design-system-react"
import NextLink from "next/link"
import { useContext, useMemo } from "react"
import { Controller } from "react-hook-form"
import { BiCheckShield, BiInfoCircle, BiSolidHelpCircle } from "react-icons/bi"
import { UserManagementContext } from "~/features/users"
import { useZodForm } from "~/lib/form"
import { AuditLogExportRequestedReportType } from "~/schemas/audit"
import { trpc } from "~/utils/trpc"

import { auditLogExportFormSchema } from "./schema"
import { useCreateAuditLogExportRequest } from "./useCreateAuditLogExportRequest"
import { getMonthOptions } from "./utils"

interface AuditLogExportSectionProps {
  siteId: number
}

export const AuditLogExportSection = ({
  siteId,
}: AuditLogExportSectionProps): JSX.Element | null => {
  const ability = useContext(UserManagementContext)
  const canManageUsers = ability.can("manage", "UserManagement")

  // How many months back the picker may offer — the standard window, or fewer
  // for a site younger than that (see `getAuditLogExportWindow`). Falls back
  // to the full window while loading; `monthOptions[0]` (the current month,
  // used as the form's default) is unaffected either way, since the cap only
  // ever trims how far back the list goes.
  const { data: exportWindow } = trpc.audit.getExportWindow.useQuery(
    {
      siteId,
    },
    { initialData: { maxMonths: 12 } },
  )

  const monthOptions = useMemo(
    () => getMonthOptions(undefined, exportWindow?.maxMonths),
    [exportWindow?.maxMonths],
  )

  // Form state lives in react-hook-form, validated by a schema built on the
  // same one the tRPC procedure uses (minus `siteId` and `reportType`, see
  // schema.ts), so client and server validation cannot drift.
  const form = useZodForm({
    schema: auditLogExportFormSchema,
    defaultValues: {
      month: monthOptions[0]?.value ?? "",
    },
  })

  // The "to date" caveat only makes sense for the current (partial) month;
  // past months in the picker are always complete calendar months.
  const selectedMonth = form.watch("month")
  const isCurrentMonthSelected = selectedMonth === monthOptions[0]?.value

  // Shared with the user-management "Export access logs" button: success and
  // error toasts plus the per-log-type PostHog captures live in the hook.
  const { mutate: createExportRequest, isPending } =
    useCreateAuditLogExportRequest({
      siteId,
      onSuccess: () => form.reset(),
    })

  if (!canManageUsers) return null

  // This section only ever requests the Activity log — the Access (user
  // review) log moved to its own one-click button on the Users page, which
  // the Infobox below links out to.
  const onSubmit = form.handleSubmit(({ month }) =>
    createExportRequest({
      siteId,
      month,
      reportType: AuditLogExportRequestedReportType.Activity,
    }),
  )

  return (
    <Stack spacing="1.5rem" align="flex-start">
      <Flex align="center" gap="0.75rem">
        <Center
          boxSize="2rem"
          bgColor="brand.secondary.100"
          borderRadius="6px"
          flexShrink={0}
        >
          <Icon
            as={BiCheckShield}
            boxSize="1rem"
            color="base.content.default"
          />
        </Center>
        <Text as="h1" textStyle="h3" color="base.content.default">
          Audit logs
        </Text>
      </Flex>

      <Stack
        as="form"
        spacing="1.25rem"
        align="flex-start"
        w="full"
        maxW="37.5rem"
        onSubmit={onSubmit}
      >
        <Text textStyle="body-2" color="base.content.default">
          Export a .csv file of login history and content changes.
        </Text>

        <Infobox
          variant="info"
          size="sm"
          w="full"
          border="1px solid"
          borderColor="base.divider.brand"
          borderRadius="4px"
        >
          <Text>
            Reviewing who has access to manage your site? You can view and
            export it on{" "}
            <Link
              as={NextLink}
              href={`/sites/${siteId}/users`}
              textDecoration="underline"
            >
              User management
            </Link>
            .
          </Text>
        </Infobox>

        <Box w="full">
          <HStack spacing="0.5rem" mb="0.5rem" align="center">
            <Text textStyle="subhead-2" color="base.content.strong">
              Include activities from the month of
            </Text>
            <TouchableTooltip
              label="You can download logs from the past year."
              wrapperStyles={{ display: "flex", alignItems: "center" }}
            >
              <Icon as={BiSolidHelpCircle} />
            </TouchableTooltip>
          </HStack>
          <Controller
            control={form.control}
            name="month"
            render={({ field, fieldState }) => (
              <FormControl isInvalid={!!fieldState.error} maxW="20.125rem">
                <SingleSelect
                  size="xs"
                  name="month"
                  value={field.value}
                  onChange={field.onChange}
                  items={monthOptions}
                  isClearable={false}
                  isSearchable={false}
                />
                <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
              </FormControl>
            )}
          />
          {isCurrentMonthSelected && (
            <HStack spacing="0.25rem" align="center" mt="0.75rem" w="full">
              <Icon
                as={BiInfoCircle}
                boxSize="1rem"
                color="utility.feedback.info"
                flexShrink={0}
              />
              <Text textStyle="caption-2" color="base.content.default">
                This will include activities from 1st day of the month to date.
              </Text>
            </HStack>
          )}
        </Box>

        <Button type="submit" isLoading={isPending}>
          Export logs
        </Button>
      </Stack>
    </Stack>
  )
}
