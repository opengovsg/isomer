"use client"

import type { DgsApiDatasetSearchParams } from "~/hooks/useDgsData/types"
import type {
  ContactInformationUIProps,
  DgsContactInformationProps,
  DgsTransformedContactInformationProps,
} from "~/interfaces"
import { omit, pick } from "lodash-es"
import { useMemo } from "react"
import { transformDgsField, useDgsData } from "~/hooks/useDgsData"
import { InjectableContactInformationKeys } from "~/interfaces/complex/ContactInformation/constants"
import { safeJsonParse } from "~/utils/safeJsonParse"

import { type ContentBlockIndexProps } from "../../../../render/contentBlockIndex"
import { ContactInformationUI } from "../components"

type DgsContactInformationRenderProps = DgsContactInformationProps &
  ContentBlockIndexProps

export const DgsContactInformation = ({
  dataSource: { resourceId, filters },
  contentBlockIndex,
  ...rest
}: DgsContactInformationRenderProps) => {
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
        {...pick(rest, "type", "layout", "headingLevel")}
        acceptHtmlTags
        contentBlockIndex={contentBlockIndex}
      />
    )
  }

  const record = records?.[0]

  // Should display nothing if there is an realtime error
  // as any rendering will likely seems jank and useless
  if (isError || !record) {
    return null
  }

  return (
    <DgsTransformedContactInformation
      {...rest}
      record={record}
      contentBlockIndex={contentBlockIndex}
    />
  )
}

export const DgsTransformedContactInformation = ({
  record,
  isLoading,
  contentBlockIndex,
  ...rest
}: DgsTransformedContactInformationProps & ContentBlockIndexProps) => {
  const title = transformDgsField(
    rest.title,
    record,
  ) as ContactInformationUIProps["title"]

  const description = transformDgsField(
    rest.description,
    record,
  ) as ContactInformationUIProps["description"]

  const methods = safeJsonParse<ContactInformationUIProps["methods"]>(
    transformDgsField(rest.methods, record),
  )

  const otherInformation = safeJsonParse<
    ContactInformationUIProps["otherInformation"]
  >(transformDgsField(rest.otherInformation, record))

  return (
    <ContactInformationUI
      isLoading={isLoading}
      title={title}
      description={description}
      methods={methods ?? []}
      otherInformation={otherInformation}
      type={rest.type}
      layout={rest.layout}
      headingLevel={rest.headingLevel}
      contentBlockIndex={contentBlockIndex}
      {...omit(rest, InjectableContactInformationKeys)}
      acceptHtmlTags
    />
  )
}
