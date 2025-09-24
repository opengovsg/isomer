"use client"

import { useMemo } from "react"
import omit from "lodash/omit"
import pick from "lodash/pick"

import type { DgsApiDatasetSearchParams } from "~/hooks/useDgsData/types"
import type {
  ContactInformationUIProps,
  DgsContactInformationProps,
  DgsTransformedContactInformationProps,
} from "~/interfaces"
import { transformDgsField, useDgsData } from "~/hooks/useDgsData"
import { InjectableContactInformationKeys } from "~/interfaces"
import { safeJsonParse } from "~/utils"
import { ContactInformationUI } from "../components"

export const DgsContactInformation = ({
  dataSource: { resourceId, filters },
  ...rest
}: DgsContactInformationProps) => {
  const params = useMemo(
    () => ({
      resourceId,
      filters: filters?.reduce(
        (acc, filter) => {
          acc[filter.fieldKey] = filter.fieldValue
          return acc
        },
        {} as NonNullable<DgsApiDatasetSearchParams["filters"]>,
      ),
    }),
    [resourceId, filters],
  )

  const { records, isLoading, isError } = useDgsData(params)

  if (isLoading) {
    return (
      <ContactInformationUI
        isLoading={isLoading}
        methods={[]} // not needed for loading state but its required prop
        {...pick(rest, "type", "layout")}
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
  ...rest
}: DgsTransformedContactInformationProps) => {
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
      {...omit(rest, InjectableContactInformationKeys)}
      acceptHtmlTags
    />
  )
}
