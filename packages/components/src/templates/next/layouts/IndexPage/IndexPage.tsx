import type { IndexPageSchemaType } from "~/engine"
import { tv } from "~/lib/tv"
import { getBreadcrumbFromSiteMap, getSiderailFromSiteMap } from "~/utils"
import {
  BackToTopLink,
  ContentPageHeader,
  Siderail,
} from "../../components/internal"
import { renderPageContent } from "../../render"
import { Skeleton } from "../Skeleton"

const createIndexPageLayoutStyles = tv({
  slots: {
    container:
      "mx-auto grid max-w-screen-xl grid-cols-12 px-6 py-12 md:px-10 md:py-16 lg:gap-6 xl:gap-10",
    siderailContainer: "relative col-span-3 hidden lg:block",
    content: "col-span-12 flex flex-col gap-16",
  },
  variants: {
    isSideRailPresent: {
      true: {
        content: "lg:col-span-9 lg:mr-24",
      },
      false: {
        content: "max-w-[54rem]",
      },
    },
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
  const isParentPageRoot = page.permalink.split("/").length === 2

  // Note: We do not show side rail for first-level pages
  const sideRail = !isParentPageRoot
    ? getSiderailFromSiteMap(site.siteMap, page.permalink.split("/").slice(1))
    : null

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
        <div
          className={compoundStyles.content({ isSideRailPresent: !!sideRail })}
        >
          {renderPageContent({
            content,
            layout,
            site,
            LinkComponent,
          })}
        </div>

        {sideRail && (
          <div className={compoundStyles.siderailContainer()}>
            <Siderail {...sideRail} LinkComponent={LinkComponent} />
            <BackToTopLink LinkComponent={LinkComponent} />
          </div>
        )}
      </div>
    </Skeleton>
  )
}

export default IndexPageLayout
