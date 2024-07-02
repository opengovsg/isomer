import { ArticlePageSchema } from "~/engine";
import { getBreadcrumbFromSiteMap } from "~/utils";
import ArticlePageHeader from "../../components/internal/ArticlePageHeader";
import { renderPageContent } from "../../render";
import { Skeleton } from "../Skeleton";

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
  );

  return (
    <Skeleton
      site={site}
      page={page}
      LinkComponent={LinkComponent}
      ScriptComponent={ScriptComponent}
    >
      <div className="mx-auto flex max-w-[47.8rem] flex-col gap-20 px-6 md:px-10">
        <ArticlePageHeader
          {...page.articlePageHeader}
          breadcrumb={breadcrumb}
          category={page.category}
          title={page.title}
          date={page.date}
          LinkComponent={LinkComponent}
        />

        <div className="mx-auto w-full gap-10 pb-20">
          <div className="w-full overflow-x-auto lg:max-w-[660px]">
            {renderPageContent({ content, LinkComponent })}
          </div>
        </div>
      </div>
    </Skeleton>
  );
};

export default ArticleLayout;
