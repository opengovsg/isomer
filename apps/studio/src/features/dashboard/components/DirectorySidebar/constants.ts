import type { IconType } from "react-icons"
import { ResourceType } from "~prisma/generated/generatedEnums"
import {
  BiData,
  BiFile,
  BiFolder,
  BiHomeAlt,
  BiLink,
  BiSort,
} from "react-icons/bi"

export const ICON_MAPPINGS: Record<ResourceType, IconType> = {
  [ResourceType.Page]: BiFile,
  [ResourceType.Folder]: BiFolder,
  [ResourceType.Collection]: BiData,
  [ResourceType.CollectionPage]: BiFile,
  [ResourceType.CollectionLink]: BiLink,
  [ResourceType.RootPage]: BiHomeAlt,
  [ResourceType.IndexPage]: BiFile,
  [ResourceType.FolderMeta]: BiSort,
}
