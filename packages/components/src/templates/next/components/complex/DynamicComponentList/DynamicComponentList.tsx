"use client"

import { useMemo } from "react"

import type { DgsApiDatasetSearchParams } from "~/hooks/useDgsData/types"
import type { DynamicComponentListProps } from "~/interfaces"
import { useDgsData } from "~/hooks/useDgsData"
import { CONTACT_INFORMATION_TYPE } from "~/interfaces"
import { DgsTransformedContactInformation } from "../ContactInformation"

const DynamicComponentList = ({
  type: _type,
  dataSource: { resourceId, sort, filters },
  component,
  layout,
  LinkComponent,
}: DynamicComponentListProps) => {
  const params = useMemo(
    () => ({
      resourceId,
      sort,
      filters: filters?.reduce(
        (acc, filter) => {
          acc[filter.fieldKey] = filter.fieldValue
          return acc
        },
        {} as NonNullable<DgsApiDatasetSearchParams["filters"]>,
      ),
    }),
    [resourceId, sort, filters],
  )

  const { records, isLoading, isError } = useDgsData(params)

  // Should display nothing if there is an realtime error
  // as any rendering will likely seems jank and useless
  if (isError || !records || records.length === 0) {
    return null
  }

  // TODO: better handling of these non-success states
  if (isLoading) {
    return <div>Loading...</div>
  }

  switch (component.type) {
    // Disabling for now so its easier to extend in the future
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case CONTACT_INFORMATION_TYPE:
      return records.map((record, index) => (
        <DgsTransformedContactInformation
          key={`${component.type}-${index}`}
          record={record}
          {...component}
          layout={layout}
          LinkComponent={LinkComponent}
        />
      ))

    default:
      return null
  }
}

export default DynamicComponentList
