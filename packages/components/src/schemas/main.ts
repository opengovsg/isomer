import type { TSchema } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerComponentTypes, IsomerSchema } from "~/types"
import {
  ArticlePageMetaSchema,
  CollectionPageSchema,
  ContentPageMetaSchema,
  FileRefSchema,
  HomePageMetaSchema,
  IsomerPageSchema,
  LinkRefSchema,
} from "~/types"
import {
  IsomerComplexComponentsMap,
  IsomerNativeComponentsMap,
} from "./components"

const definitions = {
  components: {
    complex: IsomerComplexComponentsMap,
    native: IsomerNativeComponentsMap,
  },
}

export const schema: TSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Isomer Next Page Schema",
  ...IsomerPageSchema,
  ...definitions,
}

export const getComponentSchema = (
  component: IsomerComponentTypes,
): TSchema => {
  const componentSchema =
    component === "prose"
      ? Type.Ref(IsomerNativeComponentsMap.prose)
      : IsomerComplexComponentsMap[component]

  return {
    ...componentSchema,
    ...definitions,
  }
}

const LAYOUT_METADATA_MAP = {
  article: ArticlePageMetaSchema,
  content: ContentPageMetaSchema,
  homepage: HomePageMetaSchema,
  index: ContentPageMetaSchema,
  link: LinkRefSchema,
  collection: CollectionPageSchema,
  file: FileRefSchema,
}

export const getLayoutMetadataSchema = (
  layout: IsomerSchema["layout"],
): TSchema => {
  return LAYOUT_METADATA_MAP[layout]
}
