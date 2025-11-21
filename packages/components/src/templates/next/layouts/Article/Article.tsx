import type { ArticlePageSchemaType } from "~/types"
import { getBreadcrumbFromSiteMap } from "~/utils/getBreadcrumbFromSiteMap"
import { getIndexByPermalink } from "~/utils/getIndexByPermalink"
import { ArticlePageHeader } from "../../components/internal/ArticlePageHeader"
import { BackToTopLink } from "../../components/internal/BackToTopLink"
import { renderPageContent } from "../../render/renderPageContent"
import { getTagsFromTagged } from "../Collection/utils/getTagsFromTagged"
import { Skeleton } from "../Skeleton"

export const ArticleLayout = ({
  site,
  page,
  layout,
  content,
  LinkComponent,
}: ArticlePageSchemaType) => {
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

  return (
    <Skeleton
      site={site}
      page={page}
      layout={layout}
      LinkComponent={LinkComponent}
    >
      <div className="mx-auto flex max-w-[47.8rem] flex-col gap-7 px-6 md:px-10">
        <ArticlePageHeader
          {...page.articlePageHeader}
          breadcrumb={breadcrumb}
          category={page.category}
          title={page.title}
          date={page.date}
          LinkComponent={LinkComponent}
          tags={resolvedTags}
        />

        <div className="mx-auto w-full gap-10 pb-20">
          <div className="w-full overflow-x-auto break-words lg:max-w-[660px]">
            {renderPageContent({
              site,
              layout,
              content,
              LinkComponent,
              permalink: page.permalink,
            })}
          </div>
          <BackToTopLink />
        </div>
      </div>
    </Skeleton>
  )
}
