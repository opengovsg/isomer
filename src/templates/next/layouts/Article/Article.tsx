import { ArticlePageSchema } from "~/engine"
import { getBreadcrumbFromSiteMap } from "~/utils"
import { Skeleton } from "../Skeleton"
import ArticlePageHeader from "../../components/shared/ArticlePageHeader"
import { renderComponent } from "../render"

const ArticleLayout = ({
  site,
  page,
  content,
  LinkComponent,
  ScriptComponent,
}: ArticlePageSchema) => {
  const breadcrumb = getBreadcrumbFromSiteMap(
    site.siteMap,
    page.permalink.split("/").slice(1),
  )

  return (
    <Skeleton
      site={site}
      page={page}
      LinkComponent={LinkComponent}
      ScriptComponent={ScriptComponent}
    >
      <div className="flex flex-col gap-20 px-6 md:px-10 max-w-[1240px] mx-auto">
        <ArticlePageHeader
          {...page.articlePageHeader}
          breadcrumb={breadcrumb}
          category={page.category}
          title={page.title}
          date={page.date}
          LinkComponent={LinkComponent}
        />

        <hr className="border-divider-medium" />

        <div className="flex flex-col lg:flex-row gap-10 pb-16 mx-auto">
          <div className="overflow-x-auto w-full lg:max-w-[660px]">
            {content.map((component) =>
              renderComponent({ component, LinkComponent }),
            )}
          </div>

          <div className="w-full lg:max-w-[260px]">
            <p>Placeholder for related articles component</p>
          </div>
        </div>
      </div>
    </Skeleton>
  )
}

export default ArticleLayout
