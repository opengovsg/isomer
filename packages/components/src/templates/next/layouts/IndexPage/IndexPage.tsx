import type { IndexPageSchemaType } from "~/types"
import { DEFAULT_CHILDREN_PAGES_BLOCK } from "~/interfaces/complex/ChildrenPages/constants"
import { tv } from "~/lib/tv"
import {
  getBreadcrumbFromSiteMap,
  getTableOfContents,
  getTransformedPageContent,
} from "~/utils"
import { ContentPageHeader } from "../../components/internal/ContentPageHeader"
import { TableOfContents } from "../../components/internal/TableOfContents"
import { renderPageContent } from "../../render"
import { Skeleton } from "../Skeleton"

const createIndexPageLayoutStyles = tv({
  slots: {
    container:
      "mx-auto grid max-w-screen-xl grid-cols-12 px-6 py-12 md:px-10 md:py-16 lg:gap-10",
    siderailContainer: "relative col-span-3 hidden lg:block",
    content: "col-span-12 break-words lg:col-span-8",
  },
})

const compoundStyles = createIndexPageLayoutStyles()

export const IndexPageLayout = ({
  site,
  page,
  layout,
  content,
  LinkComponent,
}: IndexPageSchemaType) => {
  const breadcrumb = getBreadcrumbFromSiteMap(
    site.siteMap,
    page.permalink.split("/").slice(1),
  )

  const hasChildpageBlock = content.some(({ type }) => type === "childrenpages")
  const pageContent: IndexPageSchemaType["content"] = hasChildpageBlock
    ? content
    : [...content, DEFAULT_CHILDREN_PAGES_BLOCK]
  // auto-inject ids for heading level 2 blocks if does not exist
  const transformedContent = getTransformedPageContent(pageContent)
  const tableOfContents = getTableOfContents(site, transformedContent)

  return (
    <Skeleton
      site={site}
      page={page}
      layout={layout}
      LinkComponent={LinkComponent}
    >
      <ContentPageHeader
        {...page.contentPageHeader}
        colorScheme="inverse"
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
          {renderPageContent({
            content: transformedContent,
            layout,
            site,
            LinkComponent,
            permalink: page.permalink,
          })}
        </div>
      </div>
    </Skeleton>
  )
}
