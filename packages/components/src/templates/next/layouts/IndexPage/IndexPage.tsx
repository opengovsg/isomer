import type { IndexPageSchemaType } from "~/engine"
import { tv } from "~/lib/tv"
import { getBreadcrumbFromSiteMap } from "~/utils"
import { ChildrenPages, ContentPageHeader } from "../../components/internal"
import { renderPageContent } from "../../render"
import { Skeleton } from "../Skeleton"

const createIndexPageLayoutStyles = tv({
  slots: {
    container:
      "mx-auto grid max-w-screen-xl grid-cols-12 px-6 py-12 md:px-10 md:py-16 lg:gap-6 xl:gap-10",
    siderailContainer: "relative col-span-3 hidden lg:block",
    content: "col-span-12 break-words",
  },
})

const compoundStyles = createIndexPageLayoutStyles()

const IndexPageLayout = ({
  site,
  page,
  childpages,
  layout,
  content,
  LinkComponent,
  ScriptComponent,
}: IndexPageSchemaType) => {
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
            content,
            layout,
            site,
            LinkComponent,
          })}

          <ChildrenPages
            permalink={page.permalink}
            site={site}
            LinkComponent={LinkComponent}
            {...childpages}
          />
        </div>
      </div>
    </Skeleton>
  )
}

export default IndexPageLayout
