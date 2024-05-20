import { ContentPageSchema, IsomerSitemap } from "~/engine"
import type { SiderailProps } from "~/interfaces"
import { getBreadcrumbFromSiteMap, getTextAsHtml } from "~/utils"
import {
  ContentPageHeader,
  Siderail,
  TableOfContents,
} from "../../components/internal"
import { renderPageContent } from "../../render"
import { Skeleton } from "../Skeleton"

const getSiderailFromSiteMap = (
  sitemap: IsomerSitemap,
  permalink: string[],
): SiderailProps | null => {
  let node = sitemap
  let currentPath = ""

  let i = 0
  while (i < permalink.length - 1) {
    currentPath += "/" + permalink[i]
    const nextNode = node.children?.find(
      (node) => node.permalink === currentPath,
    )
    if (!nextNode) {
      // TODO: handle this unexpected case where cannot traverse to parent in the sitemap
      return null
    }
    node = nextNode
    i++
  }
  if (!node.children) {
    // TODO: handle this unexpected case where parent does not contain current page
    return null
  }
  const parentTitle = node.title
  const parentUrl = node.permalink

  const pages = []
  // get all siblings of page
  const pagePath = "/" + permalink.join("/")
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
      })
    } else {
      pages.push({
        title: sibling.title,
        url: sibling.permalink,
      })
    }
  }
  return {
    parentTitle,
    parentUrl,
    pages,
  }
}

const getTableOfContentsFromContent = (
  content: ContentPageSchema["content"],
) => {
  const items = []
  for (const block of content) {
    if (block.type === "heading" && block.level === 2) {
      items.push({
        content: getTextAsHtml(block.content),
        anchorLink: "#" + block.id,
      })
    }
  }
  return { items }
}

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
  )
  const tableOfContents = getTableOfContentsFromContent(content)
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
      <div className="flex gap-[120px] px-6 md:px-10 py-16 max-w-container mx-auto justify-center">
        {sideRail && (
          <div className="hidden lg:block w-full max-w-[240px]">
            <Siderail {...sideRail} LinkComponent={LinkComponent} />
          </div>
        )}
        <div className="flex flex-col gap-[90px] overflow-x-auto w-full max-w-[800px]">
          {tableOfContents.items.length > 1 && (
            <TableOfContents {...tableOfContents} />
          )}
          <div>{renderPageContent({ content, LinkComponent })}</div>
        </div>
      </div>
    </Skeleton>
  )
}

export default ContentLayout
