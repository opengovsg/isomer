import { ContentPageSchema } from "~/engine"
import ContentPageHeader from "../../components/shared/ContentPageHeader"
import Siderail from "../../components/shared/Siderail"
import TableOfContents from "../../components/shared/TableOfContents"
import { Skeleton } from "../Skeleton"
import { renderComponent } from "../render"

const getBreadcrumbFromSiteMap = (sitemap: any, permalink: string[]) => {
  const breadcrumb = []
  let node = sitemap
  let currentPath = ""
  for (const pathSegment of permalink) {
    currentPath += "/" + pathSegment
    node = node.children.find((node: any) => node.permalink === currentPath)
    breadcrumb.push({
      title: node.title,
      url: node.permalink,
    })
  }
  return { links: breadcrumb }
}

const getSiderailFromSiteMap = (sitemap: any, permalink: string[]) => {
  let node = sitemap
  let currentPath = ""

  let i = 0
  while (i < permalink.length - 1) {
    currentPath += "/" + permalink[i]
    node = node.children.find((node: any) => node.permalink === currentPath)
    i++
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
        childPages:
          sibling.children?.map((child: any) => ({
            url: child.permalink,
            title: child.title,
          })) ?? null,
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

const getTableOfContentsFromContent = ({
  content,
}: Pick<ContentPageSchema, "content">) => {
  const tableOfContents = content
    .filter((block) => block.type === "heading" && block.level === 2)
    .map((block: any) => ({
      content: block.content,
      anchorLink: "#" + block.id,
    }))
  return { items: tableOfContents }
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
  const tableOfContents = getTableOfContentsFromContent({ content })
  const breadcrumb = getBreadcrumbFromSiteMap(
    site.siteMap,
    page.permalink.split("/").slice(1),
  )
  return (
    <Skeleton site={site} page={page} LinkComponent={LinkComponent}>
      <div className="lg:hidden">{sideRail && <Siderail {...sideRail} />}</div>
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
