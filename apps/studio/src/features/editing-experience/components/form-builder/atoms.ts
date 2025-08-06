import { CollectionPagePageProps } from "@opengovsg/isomer-components"
import { atom } from "jotai"

type TagCategories = CollectionPagePageProps["tagCategories"]

export const tagCategoriesAtom = atom<TagCategories | null>(null)
