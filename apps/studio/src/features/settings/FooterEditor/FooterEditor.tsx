import type { FooterSchemaType } from "@opengovsg/isomer-components"
import type { Dispatch, SetStateAction } from "react"
import { useCallback, useState } from "react"
import {
  Box,
  HStack,
  Icon,
  Spacer,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { FooterSchema } from "@opengovsg/isomer-components"
import isEmpty from "lodash/isEmpty"
import isEqual from "lodash/isEqual"
import { BiDirections } from "react-icons/bi"

import { FORM_BUILDER_PARENT_ID } from "~/features/editing-experience/components/form-builder/constants"
import {
  ErrorProvider,
  useBuilderErrors,
} from "~/features/editing-experience/components/form-builder/ErrorProvider"
import FormBuilder from "~/features/editing-experience/components/form-builder/FormBuilder"
import { ajv } from "~/utils/ajv"

interface FooterEditorProps {
  previewFooterState?: FooterSchemaType
  setPreviewFooterState: Dispatch<SetStateAction<FooterSchemaType | undefined>>
  onSave: (data?: FooterSchemaType) => void
  isSaving: boolean
}

export const FooterEditor = ({
  previewFooterState,
  setPreviewFooterState,
  onSave,
  isSaving,
}: FooterEditorProps) => {
  const [isDirty, setIsDirty] = useState(false)

  const validateFn = ajv.compile<FooterSchemaType>(FooterSchema)

  const handleChange = useCallback(
    (data: FooterSchemaType) => {
      const updatedData = { ...previewFooterState, ...data }
      if (!isEqual(previewFooterState, updatedData)) {
        setPreviewFooterState(updatedData)
        setIsDirty(true)
      }
    },
    [previewFooterState, setPreviewFooterState],
  )

  const handleSave = () => {
    onSave(previewFooterState)
    setIsDirty(false)
  }

  return (
    <ErrorProvider>
      <VStack
        id={FORM_BUILDER_PARENT_ID}
        py="1.5rem"
        h="100%"
        w="full"
        alignItems="start"
        position="relative"
        gap="1.5rem"
      >
        {/* Header section */}
        <HStack px="2rem" gap="0.75rem" w="full">
          <Box
            aria-hidden
            bg="brand.secondary.100"
            borderRadius="0.375rem"
            p="0.5rem"
            lineHeight="0.75rem"
          >
            <Icon as={BiDirections} />
          </Box>

          <Text
            as="h2"
            textStyle="h3"
            textColor="base.content.default"
            textOverflow="ellipsis"
          >
            Footer
          </Text>

          <Spacer />

          <PublishButton
            isDirty={isDirty}
            isSaving={isSaving}
            onClick={handleSave}
          />
        </HStack>

        <VStack w="full" gap={0} alignItems="start" px="1.5rem">
          <Text textStyle="subhead-1" textColor="base.content.strong">
            Custom links
          </Text>
          <Text textStyle="body-2" textColor="base.content.default">
            You can add up to 12 links on your footer. On desktop, these links
            appear as two columns.
          </Text>

          <Box pt="0.75rem" w="full">
            <Box mb="1rem" h="full">
              <FormBuilder<FooterSchemaType>
                schema={FooterSchema}
                validateFn={validateFn}
                data={previewFooterState}
                handleChange={handleChange}
              />
            </Box>
          </Box>
        </VStack>
      </VStack>
    </ErrorProvider>
  )
}

const PublishButton = ({
  isDirty,
  isSaving,
  onClick,
}: {
  isDirty: boolean
  isSaving: boolean
  onClick: () => void
}) => {
  const { errors } = useBuilderErrors()
  const isSchemaValid = isEmpty(errors)

  return (
    <Tooltip
      label={
        !isSchemaValid
          ? "There are errors in footer. Fix them before publishing."
          : undefined
      }
      hasArrow
    >
      <Button
        size="xs"
        onClick={onClick}
        isLoading={isSaving}
        isDisabled={!isDirty || !isSchemaValid}
      >
        Publish changes
      </Button>
    </Tooltip>
  )
}
