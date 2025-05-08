import type { IndexPageSchemaType } from "~/engine"
import { DEFAULT_CHILDREN_PAGES_BLOCK } from "~/interfaces"
import { tv } from "~/lib/tv"
import { getBreadcrumbFromSiteMap } from "~/utils"
import { ContentPageHeader } from "../../components/internal"
import { renderPageContent } from "../../render"
import { Skeleton } from "../Skeleton"

const createIndexPageLayoutStyles = tv({
  slots: {
    container:
      "mx-auto grid max-w-screen-xl grid-cols-12 px-6 py-12 md:px-10 md:py-16 lg:gap-6 xl:gap-10",
    siderailContainer: "relative col-span-3 hidden lg:block",
    content: "col-span-12 break-words lg:col-span-9",
  },
})

const compoundStyles = createIndexPageLayoutStyles()

const IndexPageLayout = ({
  site,
  page,
  layout,
  content,
  LinkComponent,
  ScriptComponent,
}: IndexPageSchemaType) => {
  const breadcrumb = getBreadcrumbFromSiteMap(
    site.siteMap,
    page.permalink.split("/").slice(1),
  )

  const hasChildpageBlock = content.some(({ type }) => type === "childrenpages")
  const pageContent: IndexPageSchemaType["content"] = hasChildpageBlock
    ? content
    : [...content, DEFAULT_CHILDREN_PAGES_BLOCK]

  return (
    <Skeleton
      site={site}
      page={page}
      layout={layout}
      LinkComponent={LinkComponent}
      ScriptComponent={ScriptComponent}
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
          {renderPageContent({
            content: pageContent,
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

export default IndexPageLayout
