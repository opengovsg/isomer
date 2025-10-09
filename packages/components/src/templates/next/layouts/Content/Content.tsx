import type { ContentPageSchemaType } from "~/engine"
import { tv } from "~/lib/tv"
import {
  getAdjacentPagesFromSitemap,
  getBreadcrumbFromSiteMap,
  getSiderailFromSiteMap,
  getTableOfContents,
  getTransformedPageContent,
} from "~/utils"
import {
  BackToTopLink,
  ContentPageHeader,
  Pager,
  Siderail,
  TableOfContents,
} from "../../components/internal"
import { renderPageContent } from "../../render"
import { Skeleton } from "../Skeleton"

const createContentLayoutStyles = tv({
  slots: {
    container:
      "mx-auto grid max-w-screen-xl grid-cols-12 px-6 py-12 md:px-10 md:py-16 lg:gap-6 xl:gap-10",
    siderailContainer: "relative col-span-3 hidden lg:block",
    content:
      "col-span-12 flex flex-col gap-16 break-words lg:col-span-9 lg:mr-24",
  },
})

const compoundStyles = createContentLayoutStyles()

const ContentLayout = ({
  site,
  page,
  layout,
  content,
  LinkComponent,
}: ContentPageSchemaType) => {
  const isParentPageRoot = page.permalink.split("/").length === 2

  // Note: We do not show side rail for first-level pages
  const sideRail = !isParentPageRoot
    ? getSiderailFromSiteMap(site.siteMap, page.permalink)
    : null

  const pager = getAdjacentPagesFromSitemap(site.siteMap, page.permalink)

  // auto-inject ids for heading level 2 blocks if does not exist
  const transformedContent = getTransformedPageContent(content)
  const tableOfContents = getTableOfContents(site, transformedContent)
  const breadcrumb = getBreadcrumbFromSiteMap(
    site.siteMap,
    page.permalink.split("/").slice(1),
  )
  return (
    <Skeleton
      site={site}
      page={page}
      layout={layout}
      LinkComponent={LinkComponent}
    >
      <ContentPageHeader
        {...page.contentPageHeader}
        image={page.image}
        title={page.title}
        breadcrumb={breadcrumb}
        site={site}
        LinkComponent={LinkComponent}
        lastUpdated={page.lastModified}
      />
      <div className={compoundStyles.container()}>
        <div className={compoundStyles.content()}>
          {tableOfContents.length > 1 && (
            <TableOfContents
              items={tableOfContents}
              LinkComponent={LinkComponent}
            />
          )}
          <div>
            {renderPageContent({
              content: transformedContent,
              layout,
              site,
              LinkComponent,
              permalink: page.permalink,
            })}
          </div>
          <Pager {...pager} LinkComponent={LinkComponent}></Pager>
        </div>
        <div className={compoundStyles.siderailContainer()}>
          {sideRail && <Siderail {...sideRail} LinkComponent={LinkComponent} />}
          <BackToTopLink />
        </div>
      </div>
    </Skeleton>
  )
}

export default ContentLayout
