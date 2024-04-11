import { ArticlePageSchema } from "~/engine"
import { getBreadcrumbFromSiteMap } from "~/utils"
import { Skeleton } from "../Skeleton"
import { renderComponent } from "../render"
import ArticlePageHeader from "../../components/shared/ArticlePageHeader"
import RelatedArticles from "../../components/shared/RelatedArticles"

const ArticleLayout = ({
  site,
  page,
  content,
  LinkComponent,
  HeadComponent,
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
      HeadComponent={HeadComponent}
      ScriptComponent={ScriptComponent}
    >
      <div className="flex flex-col gap-9 lg:gap-20 px-6 md:px-10 max-w-[1240px] mx-auto">
        <ArticlePageHeader
          {...page.articlePageHeader}
          breadcrumb={breadcrumb}
          category={page.category}
          title={page.title}
          date={page.date}
          LinkComponent={LinkComponent}
        />

        <hr className="border-divider-medium" />

        <div className="flex flex-col lg:flex-row gap-20 lg:gap-10 pb-16 mx-auto">
          <div className="overflow-x-auto w-full lg:max-w-[660px]">
            {content.map((component) =>
              renderComponent({ component, LinkComponent }),
            )}
          </div>

          <div className="w-full lg:max-w-[260px]">
            <RelatedArticles
              items={[
                {
                  title:
                    "A Veterinary Council will be established to regulate standards and practices of veterinary professionals",
                  url: "/items/first",
                },
                {
                  title:
                    "Wild boar escapes Singapore Zoo; captivated and returned to safety within 3 hours",
                  url: "/items/second",
                },
                {
                  title: "Mynah population decreasing YoY, a worrying trend",
                  url: "/items/third",
                },
              ]}
              LinkComponent={LinkComponent}
            />
          </div>
        </div>
      </div>
    </Skeleton>
  )
}

export default ArticleLayout
