import type { Control, FieldErrors, UseFormRegister } from "react-hook-form"
import type { CreateGazetteInput } from "~/schemas/gazette"
import { FormControl, HStack, Input, VStack } from "@chakra-ui/react"
import {
  Attachment,
  DatePicker,
  FormErrorMessage,
  FormLabel,
  SingleSelect,
} from "@opengovsg/design-system-react"
import { Controller } from "react-hook-form"
import { TimeSelect } from "~/components/Select/TimeSelect"

import { GAZETTE_CATEGORIES, GAZETTE_SUBCATEGORIES } from "../constants"

type GazetteFormData = CreateGazetteInput

interface GazetteFormFieldsProps {
  register: UseFormRegister<GazetteFormData>
  control: Control<GazetteFormData>
  errors: FieldErrors<GazetteFormData>
  initialFile?: File
}

export const GazetteFormFields = ({
  register,
  control,
  errors,
  initialFile,
}: GazetteFormFieldsProps) => {
  return (
    <VStack alignItems="flex-start" spacing="0.75rem">
      <FormControl isRequired isInvalid={!!errors.title}>
        <FormLabel color="base.content.strong" mb="0.5rem">
          Title
        </FormLabel>
        <Input placeholder="Enter a title" {...register("title")} />
        {errors.title?.message && (
          <FormErrorMessage>{errors.title.message}</FormErrorMessage>
        )}
      </FormControl>

      <FormControl isRequired isInvalid={!!errors.category}>
        <FormLabel color="base.content.strong" mb="0.5rem">
          Category
        </FormLabel>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <SingleSelect
              {...field}
              name="category"
              items={GAZETTE_CATEGORIES}
              isClearable={false}
            />
          )}
        />
        {errors.category?.message && (
          <FormErrorMessage>{errors.category.message}</FormErrorMessage>
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
              items={GAZETTE_SUBCATEGORIES}
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
            render={({ field }) => <TimeSelect size="md" {...field} />}
          />
          {errors.publishTime?.message && (
            <FormErrorMessage>{errors.publishTime.message}</FormErrorMessage>
          )}
        </FormControl>
      </HStack>

      <FormControl>
        <FormLabel color="base.content.strong" mb="0.5rem">
          File Upload
        </FormLabel>
        <Attachment
          name="file-upload"
          multiple={false}
          value={initialFile}
          onChange={() => {
            // TODO: Handle file upload
          }}
          accept={["application/pdf", ".pdf"]}
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
