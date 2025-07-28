"use client"

import type { DynamicComponentListProps } from "~/interfaces"
import { IMAGE_GALLERY_TYPE, KEY_STATISTICS_TYPE } from "~/interfaces"
import { useDGSData } from "./dgs"
import { TransformedKeyStatistics } from "./transform"

export const DynamicComponentList = ({
  type: _type,
  dataSource,
  component,
  ...props
}: DynamicComponentListProps) => {
  const { rows, isLoading, isError } = useDGSData({
    dgsResourceId: dataSource.resourceId,
  })

  // TODO: better handling of these non-success states
  if (isLoading || isError || !rows) {
    return <div>Loading...</div>
  }

  switch (component.type) {
    case KEY_STATISTICS_TYPE:
      return (
        <TransformedKeyStatistics
          component={component}
          rows={rows}
          {...props}
        />
      )
    case IMAGE_GALLERY_TYPE:
      return null // Assume there's something, only focusing on one component as this is POC
    default:
      const _exhaustiveCheck: never = component
      return _exhaustiveCheck
  }
}
