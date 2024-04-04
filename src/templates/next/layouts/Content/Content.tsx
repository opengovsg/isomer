import { ContentPageSchema, IsomerSitemap } from "~/engine"
import ContentPageHeader from "../../components/shared/ContentPageHeader"
import Siderail from "../../components/shared/Siderail"
import TableOfContents from "../../components/shared/TableOfContents"
import { Skeleton } from "../Skeleton"
import { renderComponent } from "../render"
import { BreadcrumbProps, SiderailProps } from "~/common"

const getBreadcrumbFromSiteMap = (
  sitemap: IsomerSitemap,
  permalink: string[],
): BreadcrumbProps => {
  const breadcrumb = []
  let node = sitemap
  let currentPath = ""
  for (const pathSegment of permalink) {
    currentPath += "/" + pathSegment
    const nextNode = node.children?.find(
      (node) => node.permalink === currentPath,
    )
    if (!nextNode) {
      // TODO: handle this unexpected case where cannot traverse to permalink in the sitemap
      break
    }
    node = nextNode
    breadcrumb.push({
      title: node.title,
      url: node.permalink,
    })
  }
  return { links: breadcrumb }
}

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
        content: block.content,
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
    <Skeleton site={site} page={page} LinkComponent={LinkComponent}>
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
      />
      <div className="flex gap-[120px] px-6 md:px-10 py-16 max-w-[1240px] mx-auto justify-center">
        {sideRail && (
          <div className="hidden lg:block w-full max-w-[240px]">
            <Siderail {...sideRail} LinkComponent={LinkComponent} />
          </div>
        )}
        <div className="flex flex-col gap-[90px] w-full max-w-[800px]">
          {tableOfContents.items.length > 0 && (
            <TableOfContents {...tableOfContents} />
          )}
          <div>
            {content.map((component) =>
              renderComponent({ component, LinkComponent }),
            )}
          </div>
        </div>
      </div>
    </Skeleton>
  )
}

export default ContentLayout
