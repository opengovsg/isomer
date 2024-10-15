import type { IconType } from "react-icons"
import { ResourceType } from "~prisma/generated/generatedEnums"
import {
  BiData,
  BiFile,
  BiFolder,
  BiHomeAlt,
  BiSolidFilePdf,
} from "react-icons/bi"

export const ICON_MAPPINGS: Record<ResourceType, IconType> = {
  [ResourceType.Page]: BiFile,
  [ResourceType.Folder]: BiFolder,
  [ResourceType.Collection]: BiData,
  [ResourceType.CollectionPage]: BiFile,
  [ResourceType.CollectionLink]: BiSolidFilePdf,
  [ResourceType.RootPage]: BiHomeAlt,
  [ResourceType.IndexPage]: BiFile,
}
