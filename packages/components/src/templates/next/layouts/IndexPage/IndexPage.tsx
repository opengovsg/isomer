import { BiUpArrowAlt } from "react-icons/bi"

import type { IndexPageSchemaType } from "~/engine"
import { tv } from "~/lib/tv"
import { getBreadcrumbFromSiteMap, getSiderailFromSiteMap } from "~/utils"
import { ContentPageHeader, Siderail } from "../../components/internal"
import { renderPageContent } from "../../render"
import { Skeleton } from "../Skeleton"

const createIndexPageLayoutStyles = tv({
  slots: {
    container:
      "mx-auto grid max-w-screen-xl grid-cols-12 px-6 pb-0 pt-12 md:px-10 lg:gap-6 lg:pt-16 xl:gap-10",
    siderailContainer: "relative col-span-3 hidden lg:block",
    content: "col-span-12 flex flex-col gap-16",
  },
  variants: {
    isSideRailPresent: {
      true: {
        content: "lg:col-span-9 lg:ml-24",
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
  LinkComponent = "a",
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
        LinkComponent={LinkComponent}
        lastUpdated={page.lastModified}
      />
      <div className={compoundStyles.container()}>
        {sideRail && (
          <div className={compoundStyles.siderailContainer()}>
            <Siderail {...sideRail} LinkComponent={LinkComponent} />
            <LinkComponent
              href="#"
              // TODO: Replace LinkComponent with a custom link component with all the styles
              className="prose-body-base sticky top-8 my-8 flex items-center text-link underline-offset-4 hover:underline"
            >
              <BiUpArrowAlt aria-hidden className="h-6 w-6" />
              Back to top
            </LinkComponent>
          </div>
        )}

        <div
          className={compoundStyles.content({ isSideRailPresent: !!sideRail })}
        >
          {renderPageContent({
            content,
            assetsBaseUrl: site.assetsBaseUrl,
            LinkComponent,
          })}
        </div>
      </div>
    </Skeleton>
  )
}

export default IndexPageLayout
