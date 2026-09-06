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

import { ContactInformationUI } from "../components"

const buildDgsFilters = (
  filters: DgsContactInformationProps["dataSource"]["filters"],
): NonNullable<DgsApiDatasetSearchParams["filters"]> => {
  const result: NonNullable<DgsApiDatasetSearchParams["filters"]> = {}

  if (filters === undefined) {
    return result
  }

  for (const filter of filters) {
    result[filter.fieldKey] = filter.fieldValue
  }

  return result
}

export const DgsContactInformation = ({
  dataSource: { resourceId, filters },
  ...rest
}: DgsContactInformationProps) => {
  const params = useMemo(
    () => ({
      filters: buildDgsFilters(filters),
      resourceId,
    }),
    [resourceId, filters],
  )

  const { records, isLoading, isError } = useDgsData(params)

  if (isLoading) {
    return (
      <ContactInformationUI
        isLoading={isLoading}
        methods={[]}
        {...pick(rest, "type", "layout", "headingLevel")}
        acceptHtmlTags
      />
    )
  }

  const record = records?.[0]

  // Should display nothing if there is an realtime error
  // as any rendering will likely seems jank and useless
  if (isError || record === undefined) {
    return null
  }

  return <DgsTransformedContactInformation {...rest} record={record} />
}

export const DgsTransformedContactInformation = ({
  record,
  isLoading,
  ...rest
}: DgsTransformedContactInformationProps) => {
  // SAFETY: transformDgsField returns the DGS record value typed as the configured field contract.
  const title = transformDgsField(
    rest.title,
    record,
  ) as ContactInformationUIProps["title"]

  // SAFETY: transformDgsField returns the DGS record value typed as the configured field contract.
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
      {...omit(rest, InjectableContactInformationKeys)}
      acceptHtmlTags
    />
  )
}
