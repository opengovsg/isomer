import type { DynamicComponentListProps } from "~/interfaces"

import { DynamicComponentListClient } from "./DynamicComponentListClient"

// Server wrapper so `site` (which holds the whole sitemap) is not serialized
// into the RSC payload of every page using this client component
export const DynamicComponentList = ({
  dataSource,
  component,
  layout,
  headingLevel,
}: DynamicComponentListProps) => (
  <DynamicComponentListClient
    dataSource={dataSource}
    component={component}
    layout={layout}
    headingLevel={headingLevel}
  />
)
