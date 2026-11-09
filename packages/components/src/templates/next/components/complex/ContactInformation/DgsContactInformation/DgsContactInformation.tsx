"use client"

import type { DgsApiDatasetSearchParams } from "~/hooks/useDgsData/types"
import type {
  ContactInformationUIProps,
  DgsContactInformationProps,
  DgsTransformedContactInformationProps,
} from "~/interfaces"
import { useMemo } from "react"
import { transformDgsField, useDgsData } from "~/hooks/useDgsData"
import { safeJsonParse } from "~/utils/safeJsonParse"

import { ContactInformationUI } from "../components"

export const DgsContactInformation = ({
  dataSource: { resourceId, filters },
  ...rest
}: DgsContactInformationProps) => {
  const params = useMemo(
    () => ({
      resourceId,
      filters: filters?.reduce<
        NonNullable<DgsApiDatasetSearchParams["filters"]>
      >((acc, filter) => {
        acc[filter.fieldKey] = filter.fieldValue
        return acc
      }, {}),
    }),
    [resourceId, filters],
  )

  const { records, isLoading, isError } = useDgsData(params)

  if (isLoading) {
    return (
      <ContactInformationUI
        isLoading={isLoading}
        methods={[]} // not needed for loading state but its required prop
        type={rest.type}
        layout={rest.layout}
        headingLevel={rest.headingLevel}
        acceptHtmlTags
      />
    )
  }

  const record = records?.[0]

  // Should display nothing if there is an realtime error
  // as any rendering will likely seems jank and useless
  if (isError || !record) {
    return null
  }

  return <DgsTransformedContactInformation {...rest} record={record} />
}

export const DgsTransformedContactInformation = ({
  record,
  isLoading,
  title: titleTemplate,
  description: descriptionTemplate,
  methods: methodsTemplate,
  otherInformation: otherInformationTemplate,
  ...rest
}: DgsTransformedContactInformationProps) => {
  const title = transformDgsField(
    titleTemplate,
    record,
  ) as ContactInformationUIProps["title"]

  const description = transformDgsField(
    descriptionTemplate,
    record,
  ) as ContactInformationUIProps["description"]

  const methods = safeJsonParse<ContactInformationUIProps["methods"]>(
    transformDgsField(methodsTemplate, record),
  )

  const otherInformation = safeJsonParse<
    ContactInformationUIProps["otherInformation"]
  >(transformDgsField(otherInformationTemplate, record))

  return (
    <ContactInformationUI
      isLoading={isLoading}
      title={title}
      description={description}
      methods={methods ?? []}
      otherInformation={otherInformation}
      {...rest}
      acceptHtmlTags
    />
  )
}
