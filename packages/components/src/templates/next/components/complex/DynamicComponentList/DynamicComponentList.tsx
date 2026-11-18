import type { DynamicComponentListProps } from "~/interfaces"
import { omit } from "lodash-es"

import { DynamicComponentListClient } from "./DynamicComponentListClient"

// `site` holds the whole sitemap; keep it out of the client component's
// props, which are serialized into every page's RSC payload
export const DynamicComponentList = (props: DynamicComponentListProps) => (
  <DynamicComponentListClient {...omit(props, "site")} />
)
