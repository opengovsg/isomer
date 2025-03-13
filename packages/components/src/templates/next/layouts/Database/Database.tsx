import type { DatabasePageSchemaType } from "~/engine"
import { tv } from "~/lib/tv"
import {
  getBreadcrumbFromSiteMap,
  getTableOfContents,
  getTransformedPageContent,
} from "~/utils"
import {
  ContentPageHeader,
  SearchableTable,
  TableOfContents,
} from "../../components/internal"
import { renderPageContent } from "../../render"
import { Skeleton } from "../Skeleton"

const createDatabaseLayoutStyles = tv({
  slots: {
    container:
      "mx-auto grid max-w-screen-xl grid-cols-12 px-6 py-12 md:px-10 md:py-16 lg:gap-6 xl:gap-10",
    content: "col-span-12 flex max-w-[54rem] flex-col gap-16 break-words",
    table: "col-span-12 [&:not(:first-child)]:mt-14",
  },
})

const compoundStyles = createDatabaseLayoutStyles()

const DatabaseLayout = ({
  site,
  page,
  layout,
  content,
  LinkComponent,
  ScriptComponent,
}: DatabasePageSchemaType) => {
  const breadcrumb = getBreadcrumbFromSiteMap(
    site.siteMap,
    page.permalink.split("/").slice(1),
  )
  // auto-inject ids for heading level 2 blocks if does not exist
  const transformedContent = getTransformedPageContent(content)
  const tableOfContents = getTableOfContents(site, content)

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
        {transformedContent.length > 0 && (
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
              })}
            </div>
          </div>
        )}

        <div className={compoundStyles.table()}>
          <SearchableTable {...page.database} site={site} />
        </div>
      </div>
    </Skeleton>
  )
}

export default DatabaseLayout
