import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form"
import type { CreateGazetteInput } from "~/schemas/gazette"
import { FormControl, HStack, Input, VStack } from "@chakra-ui/react"
import {
  Attachment,
  DatePicker,
  FormErrorMessage,
  FormLabel,
  SingleSelect,
  Textarea,
} from "@opengovsg/design-system-react"
import { useState } from "react"
import { Controller, useWatch } from "react-hook-form"
import { TimeSelect } from "~/components/Select/TimeSelect"
import { MAX_FILE_SIZE_BYTES } from "~/lib/fileUpload"

import { useGazetteSubcategoriesContext } from "../../contexts/GazetteSubcategoriesContext"
import { toFileId } from "../../utils/toFileId"

type GazetteFormData = CreateGazetteInput

interface GazetteFormFieldsProps {
  register: UseFormRegister<GazetteFormData>
  control: Control<GazetteFormData>
  errors: FieldErrors<GazetteFormData>
  setValue: UseFormSetValue<GazetteFormData>
  // Display-only metadata for an uploaded file. The modify modal uses this so
  // Attachment can show the existing PDF without downloading it again.
  initialFileName?: string
  initialFileSize?: number
  onFileChange?: (file: File | undefined) => void
}

// Build a synthetic File with the right name and size for display.
// `defineProperty` updates the real File instance, so built-in methods like
// `.slice()` still read `this.size` correctly.
const buildPlaceholderFile = (name: string, size?: number): File => {
  const file = new File([], name, { type: "application/pdf" })
  if (size !== undefined) {
    Object.defineProperty(file, "size", { value: size, writable: false })
  }
  return file
}

export const GazetteFormFields = ({
  register,
  control,
  errors,
  setValue,
  initialFileName,
  initialFileSize,
  onFileChange,
}: GazetteFormFieldsProps) => {
  const [file, setFile] = useState<File | undefined>(() =>
    initialFileName
      ? buildPlaceholderFile(initialFileName, initialFileSize)
      : undefined,
  )
  const { categories, categoryMap, getSubcategoriesForCategory } =
    useGazetteSubcategoriesContext()
  const category = useWatch({ control, name: "category" })
  // Do not fall back to the raw id here. An unresolved id is not a label, and
  // passing it through would leave the Subcategory dropdown empty with no clue
  // why. Show the problem instead.
  const categoryLabel = categoryMap[category]
  const isCategoryUnresolved = !!category && !categoryLabel

  return (
    <VStack alignItems="flex-start" spacing="0.75rem">
      <FormControl isRequired isInvalid={!!errors.title}>
        <FormLabel color="base.content.strong" mb="0.5rem">
          Title
        </FormLabel>
        <Textarea placeholder="Enter a title" {...register("title")} />
        {errors.title?.message && (
          <FormErrorMessage>{errors.title.message}</FormErrorMessage>
        )}
      </FormControl>

      <FormControl
        isRequired
        isInvalid={!!errors.category || isCategoryUnresolved}
      >
        <FormLabel color="base.content.strong" mb="0.5rem">
          Category
        </FormLabel>
        <Controller
          name="category"
          control={control}
          render={({ field: { onChange, ...rest } }) => (
            <SingleSelect
              {...rest}
              onChange={(newValue) => {
                onChange(newValue)
                setValue("subcategory", "", { shouldValidate: true })
              }}
              name="category"
              items={categories}
              isClearable={false}
            />
          )}
        />
        {errors.category?.message ? (
          <FormErrorMessage>{errors.category.message}</FormErrorMessage>
        ) : (
          isCategoryUnresolved && (
            <FormErrorMessage>
              This gazette's category is not one of this collection's options.
              Pick a category to continue.
            </FormErrorMessage>
          )
        )}
      </FormControl>

      <FormControl isRequired isInvalid={!!errors.subcategory}>
        <FormLabel color="base.content.strong" mb="0.5rem">
          Subcategory
        </FormLabel>
        <Controller
          name="subcategory"
          control={control}
          render={({ field: { onChange, value } }) => (
            <SingleSelect
              value={value}
              name="subcategory"
              items={getSubcategoriesForCategory(categoryLabel)}
              isClearable={false}
              onChange={onChange}
            />
          )}
        />
        {errors.subcategory?.message && (
          <FormErrorMessage>{errors.subcategory.message}</FormErrorMessage>
        )}
      </FormControl>

      <FormControl isInvalid={!!errors.notificationNumber}>
        <FormLabel color="base.content.strong" mb="0.5rem">
          Notification Number
        </FormLabel>
        <Input
          placeholder="Enter Notification Number"
          {...register("notificationNumber")}
        />
        {errors.notificationNumber?.message && (
          <FormErrorMessage>
            {errors.notificationNumber.message}
          </FormErrorMessage>
        )}
      </FormControl>

      <HStack spacing="1.5rem" w="100%" alignItems="flex-start">
        <FormControl isRequired isInvalid={!!errors.publishDate}>
          <FormLabel color="base.content.strong" mb="0.5rem">
            Date of Publication
          </FormLabel>
          <Controller
            name="publishDate"
            control={control}
            render={({ field }) => (
              <DatePicker {...field} size="md" allowManualInput={false} />
            )}
          />
          {errors.publishDate?.message && (
            <FormErrorMessage>{errors.publishDate.message}</FormErrorMessage>
          )}
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.publishTime}>
          <FormLabel color="base.content.strong" mb="0.5rem">
            Time
          </FormLabel>
          <Controller
            name="publishTime"
            control={control}
            render={({ field }) => (
              <TimeSelect minutesStep={5} size="md" {...field} />
            )}
          />
          {errors.publishTime?.message && (
            <FormErrorMessage>{errors.publishTime.message}</FormErrorMessage>
          )}
        </FormControl>
      </HStack>

      <FormControl isRequired>
        <FormLabel color="base.content.strong" mb="0.5rem">
          File Upload
        </FormLabel>
        <Attachment
          name="file-upload"
          multiple={false}
          value={file}
          accept={["application/pdf", ".pdf"]}
          maxSize={MAX_FILE_SIZE_BYTES}
          onChange={(newFile) => {
            setFile(newFile)
            onFileChange?.(newFile)
            if (newFile) {
              setValue("fileId", toFileId(newFile.name), {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          }}
        />
      </FormControl>

      <FormControl isRequired isInvalid={!!errors.fileId}>
        <FormLabel
          description="Must end in .pdf"
          color="base.content.strong"
          mb="0.5rem"
        >
          File ID
        </FormLabel>
        <Input placeholder="Enter File ID" {...register("fileId")} />
        {errors.fileId?.message && (
          <FormErrorMessage>{errors.fileId?.message}</FormErrorMessage>
        )}
      </FormControl>
    </VStack>
  )
}
