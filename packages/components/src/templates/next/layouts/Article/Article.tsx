import { type ArticlePageSchemaType } from "~/types"

import { renderPageContent } from "../../render"
import { ArticleLayoutSkeleton } from "../ArticleSkeleton"

export const ArticleLayout = (props: ArticlePageSchemaType) => {
  return (
    <ArticleLayoutSkeleton {...props} renderPageContent={renderPageContent} />
  )
}
