import { Fragment } from "react"

import type { IndexPageSchemaType } from "~/types/schema"
import { tv } from "~/lib/tv"
import { getBreadcrumbFromSiteMap } from "~/utils/getBreadcrumbFromSiteMap"
import { ContentPageHeader } from "../../components/internal/ContentPageHeader"
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

interface IndexPageLayoutSkeletonProps extends IndexPageSchemaType {
  renderPageContent: JSX.Element[]
}

export const IndexPageLayoutSkeleton = ({
  site,
  page,
  layout,
  LinkComponent,
  renderPageContent,
}: IndexPageLayoutSkeletonProps) => {
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
        colorScheme="inverse"
        title={page.title}
        breadcrumb={breadcrumb}
        site={site}
        LinkComponent={LinkComponent}
        lastUpdated={page.lastModified}
      />
      <div className={compoundStyles.container()}>
        <div className={compoundStyles.content()}>
          {renderPageContent.map((el, i) => (
            <Fragment key={i}>{el}</Fragment>
          ))}
        </div>
      </div>
    </Skeleton>
  )
}
