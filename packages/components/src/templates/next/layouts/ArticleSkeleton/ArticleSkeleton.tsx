import { type ArticlePageSchemaType } from "~/types"
import { getTagsFromTagged } from "~/utils/collection"
import { getBreadcrumbFromSiteMap } from "~/utils/getBreadcrumbFromSiteMap"
import { getIndexByPermalink } from "~/utils/getIndexByPermalink"
import { resolveCategoryLabel } from "~/utils/resolveCategoryLabel"

import type {
  RenderPageContentOutput,
  RenderPageContentParams,
} from "../../render/types"
import { ArticlePageHeader } from "../../components/internal/ArticlePageHeader"
import { BackToTopLink } from "../../components/internal/BackToTopLink"
import { Skeleton } from "../Skeleton"

interface ArticleLayoutSkeletonProps extends ArticlePageSchemaType {
  renderPageContent: (
    params: RenderPageContentParams,
  ) => RenderPageContentOutput
}

export const ArticleLayoutSkeleton = ({
  site,
  page,
  layout,
  content,
  renderPageContent,
}: ArticleLayoutSkeletonProps) => {
  const breadcrumb = getBreadcrumbFromSiteMap(
    site.siteMap,
    page.permalink.split("/").slice(1),
  )

  const parent = getIndexByPermalink(page.permalink, site.siteMap)
  const tagged = page.tagged
  const tags = page.tags

  const resolvedTags =
    tagged &&
    parent?.layout === "collection" &&
    parent.collectionPagePageProps?.tagCategories
      ? getTagsFromTagged(tagged, parent.collectionPagePageProps?.tagCategories)
      : tags

  const categoryOptions =
    parent?.layout === "collection"
      ? parent.collectionPagePageProps?.categoryOptions
      : undefined

  const resolvedCategory = resolveCategoryLabel({
    categoryId: page.categoryId,
    category: page.category,
    categoryOptions,
  })

  return (
    <Skeleton site={site} page={page} layout={layout}>
      <div className="mx-auto flex max-w-[47.8rem] flex-col gap-7 px-6 md:px-10">
        <ArticlePageHeader
          {...page.articlePageHeader}
          breadcrumb={breadcrumb}
          category={resolvedCategory}
          title={page.title}
          date={page.date}
          tags={resolvedTags}
        />

        <div className="mx-auto w-full gap-10 pb-20">
          <div className="w-full overflow-x-auto break-words lg:max-w-[660px]">
            {renderPageContent({
              site,
              layout,
              content,
              permalink: page.permalink,
            })}
          </div>
          <BackToTopLink />
        </div>
      </div>
    </Skeleton>
  )
}
