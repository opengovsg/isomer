import type { JsonSchema } from "@jsonforms/core"
import type { ISOMER_USABLE_PAGE_LAYOUTS } from "@opengovsg/isomer-components"
import React from "react"

export type UsableLayout =
  | (typeof ISOMER_USABLE_PAGE_LAYOUTS)[keyof typeof ISOMER_USABLE_PAGE_LAYOUTS]
  | undefined

type SchemaWithLayouts = JsonSchema & {
  layouts?: UsableLayout[]
}

interface ConfigWithLayout {
  layout?: UsableLayout
}

const fieldMetadataNoLayouts = (
  schema: SchemaWithLayouts | undefined,
): boolean => {
  return schema?.layouts === undefined
}

const NoLayoutContext = (config: ConfigWithLayout | undefined): boolean => {
  return config?.layout === undefined
}

const fieldLayoutsIncludesCurrentLayout = (
  schema: SchemaWithLayouts | undefined,
  config: ConfigWithLayout | undefined,
): boolean => {
  return schema?.layouts?.includes(config?.layout) ?? false
}

/**
 * Higher-order component that filters components based on field-level metadata layouts
 * Only renders the component if one of these is true:
 * 1. The field has no layouts property in its metadata
 * 2. The field's layouts property includes the current layout
 */
export function withLayoutFilter<
  P extends { schema?: SchemaWithLayouts; config?: ConfigWithLayout },
>(Component: React.ComponentType<P>): React.ComponentType<P> {
  return function LayoutFilterWrapper(props: P): React.ReactElement | null {
    const { schema, config } = props

    if (fieldMetadataNoLayouts(schema) || NoLayoutContext(config)) {
      return <Component {...props} />
    }

    if (fieldLayoutsIncludesCurrentLayout(schema, config)) {
      return <Component {...props} />
    }

    return null
  }
}
