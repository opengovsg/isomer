import type { SiderailProps } from "~/interfaces";
import { ContentPageSchema, IsomerSitemap } from "~/engine";
import {
  getBreadcrumbFromSiteMap,
  getDigestFromText,
  getRandomNumberBetIntervals,
  getTextAsHtml,
} from "~/utils";
import {
  ContentPageHeader,
  Siderail,
  TableOfContents,
} from "../../components/internal";
import { renderPageContent } from "../../render";
import { Skeleton } from "../Skeleton";

const getSiderailFromSiteMap = (
  sitemap: IsomerSitemap,
  permalink: string[],
): SiderailProps | null => {
  let node = sitemap;
  let currentPath = "";

  let i = 0;
  while (i < permalink.length - 1) {
    currentPath += "/" + permalink[i];
    const nextNode = node.children?.find(
      (node) => node.permalink === currentPath,
    );
    if (!nextNode) {
      // TODO: handle this unexpected case where cannot traverse to parent in the sitemap
      return null;
    }
    node = nextNode;
    i++;
  }
  if (!node.children) {
    // TODO: handle this unexpected case where parent does not contain current page
    return null;
  }
  const parentTitle = node.title;
  const parentUrl = node.permalink;

  const pages = [];
  // get all siblings of page
  const pagePath = "/" + permalink.join("/");
  for (const sibling of node.children) {
    if (sibling.permalink === pagePath) {
      pages.push({
        title: sibling.title,
        url: sibling.permalink,
        isCurrent: true,
        childPages: sibling.children?.map((child) => ({
          url: child.permalink,
          title: child.title,
        })),
      });
    } else {
      pages.push({
        title: sibling.title,
        url: sibling.permalink,
      });
    }
  }
  return {
    parentTitle,
    parentUrl,
    pages,
  };
};

const getTableOfContentsFromContent = (
  content: ContentPageSchema["content"],
) => {
  const items = [];
  for (const block of content) {
    if (block.type === "heading" && block.level === 2) {
      items.push({
        content: getTextAsHtml(block.content),
        anchorLink: "#" + block.id,
      });
    }
  }
  return { items };
};

// if block.id is not present for heading level 2, we auto-generate one
// for use in table of contents anchor links
const transformContent = (content: ContentPageSchema["content"]) => {
  const transformedContent: ContentPageSchema["content"] = [];
  for (let i = 0; i < content.length; i++) {
    const block = content[i];
    if (
      block.type === "heading" &&
      block.level === 2 &&
      block.id === undefined
    ) {
      // generate a unique hash to auto-generate anchor links
      const anchorId = getDigestFromText(
        `${JSON.stringify(block)}_${getRandomNumberBetIntervals(1, 1000)}`,
      );

      transformedContent.push({ ...block, id: anchorId });
    } else {
      transformedContent.push(block);
    }
  }
  return transformedContent;
};

const ContentLayout = ({
  site,
  page,
  content,
  LinkComponent,
  ScriptComponent,
}: ContentPageSchema) => {
  const sideRail = getSiderailFromSiteMap(
    site.siteMap,
    page.permalink.split("/").slice(1),
  );
  // auto-inject ids for heading level 2 blocks if does not exist
  const transformedContent = transformContent(content);
  const tableOfContents = getTableOfContentsFromContent(transformedContent);
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
      {sideRail && (
        <div className="lg:hidden">
          <Siderail {...sideRail} LinkComponent={LinkComponent} />
        </div>
      )}
      <ContentPageHeader
        {...page.contentPageHeader}
        title={page.title}
        breadcrumb={breadcrumb}
        LinkComponent={LinkComponent}
        lastUpdated={page.lastModified}
      />
      <div className="mx-auto flex max-w-container justify-center gap-[120px] px-6 py-16 md:px-10">
        {sideRail && (
          <div className="hidden w-full max-w-[240px] lg:block">
            <Siderail {...sideRail} LinkComponent={LinkComponent} />
          </div>
        )}
        <div className="flex w-full max-w-[800px] flex-col gap-[90px] overflow-x-auto">
          {tableOfContents.items.length > 1 && (
            <TableOfContents {...tableOfContents} />
          )}
          <div>
            {renderPageContent({ content: transformedContent, LinkComponent })}
          </div>
        </div>
      </div>
    </Skeleton>
  );
};

export default ContentLayout;
