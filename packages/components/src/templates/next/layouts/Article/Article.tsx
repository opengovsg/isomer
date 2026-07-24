import { type ArticlePageSchemaType } from "~/types"
import { getBreadcrumbFromSiteMap } from "~/utils/getBreadcrumbFromSiteMap"
import { getIndexByPermalink } from "~/utils/getIndexByPermalink"

import { ArticlePageHeader } from "../../components/internal/ArticlePageHeader"
import { BackToTopLink } from "../../components/internal/BackToTopLink"
import { renderPageContent } from "../../render"
import { getPillAndPlaintextTags } from "../Collection/utils/getPillAndPlaintextTags"
import { Skeleton } from "../Skeleton"

export const ArticleLayout = ({
  site,
  page,
  layout,
  content,
}: ArticlePageSchemaType) => {
  const breadcrumb = getBreadcrumbFromSiteMap(
    site.siteMap,
    page.permalink.split("/").slice(1),
  )

  const parent = getIndexByPermalink(page.permalink, site.siteMap)

  const parentTagCategories =
    parent?.layout === "collection"
      ? parent.collectionPagePageProps?.tagCategories
      : undefined

  // NOTE: No longer falls back to the legacy `page.tags` field — Article Pages are
  // expected to carry `tagged` + the parent Collection's `tagCategories` going forward.
  const { pillTags, plaintextTags } = getPillAndPlaintextTags(
    page.tagged,
    parentTagCategories,
  )

  return (
    <Skeleton site={site} page={page} layout={layout}>
      <div className="mx-auto flex max-w-[47.8rem] flex-col gap-7 px-6 md:px-10">
        <ArticlePageHeader
          {...page.articlePageHeader}
          breadcrumb={breadcrumb}
          plaintextTags={plaintextTags}
          title={page.title}
          date={page.date}
          pillTags={pillTags}
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
