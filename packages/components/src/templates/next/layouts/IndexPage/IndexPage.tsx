import type { IndexPageSchemaType } from "~/engine"
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
    content: "col-span-12 flex max-w-[54rem] flex-col gap-16",
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
        </div>
      </div>
    </Skeleton>
  )
}

export default IndexPageLayout
