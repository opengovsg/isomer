import { tv } from "tailwind-variants"

import type { ContentPageSchemaType, IsomerSitemap } from "~/engine"
import type { SiderailProps } from "~/interfaces"
import {
  getBreadcrumbFromSiteMap,
  getDigestFromText,
  getRandomNumberBetIntervals,
  getTextAsHtml,
} from "~/utils"
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
  content: ContentPageSchemaType["content"],
) => {
  return {
    items: content.flatMap((block) => {
      if (block.type !== "prose" || !block.content) {
        return []
      }

      const result = []

      for (const component of block.content) {
        if (component.type === "heading" && component.attrs.level === 2) {
          result.push({
            content: getTextAsHtml(component.content),
            anchorLink: "#" + component.attrs.id,
          })
        }
      }

      return result
    }),
  }
}

// if block.id is not present for heading level 2, we auto-generate one
// for use in table of contents anchor links
const transformContent = (content: ContentPageSchemaType["content"]) => {
  const transformedContent: ContentPageSchemaType["content"] = []
  for (const block of content) {
    if (block.type === "prose" && block.content) {
      const transformedBlock = {
        ...block,
        content: block.content.map((component) => {
          if (
            component.type === "heading" &&
            component.attrs.level === 2 &&
            component.attrs.id === undefined
          ) {
            // generate a unique hash to auto-generate anchor links
            const anchorId = getDigestFromText(
              `${JSON.stringify(component)}_${getRandomNumberBetIntervals(1, 1000)}`,
            )

            return { ...component, id: anchorId }
          } else {
            return component
          }
        }),
      }

      transformedContent.push(transformedBlock)
    } else {
      transformedContent.push(block)
    }
  }
  return transformedContent
}

const createContentLayoutStyles = tv({
  slots: {
    container:
      "mx-auto grid max-w-screen-xl grid-cols-12 px-6 py-12 md:gap-6 md:px-10 md:py-16 lg:gap-10",
    siderailContainer: "col-span-3 hidden md:block",
    content: "col-span-12 flex flex-col gap-16 md:col-span-9 md:ml-24",
  },
})

const compoundStyles = createContentLayoutStyles()

const ContentLayout = ({
  site,
  page,
  content,
  LinkComponent,
  ScriptComponent,
}: ContentPageSchemaType) => {
  const sideRail = getSiderailFromSiteMap(
    site.siteMap,
    page.permalink.split("/").slice(1),
  )
  // auto-inject ids for heading level 2 blocks if does not exist
  const transformedContent = transformContent(content)
  const tableOfContents = getTableOfContentsFromContent(transformedContent)
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
          </div>
        )}
        <div className={compoundStyles.content()}>
          {tableOfContents.items.length > 1 && (
            <TableOfContents {...tableOfContents} />
          )}
          <div>
            {renderPageContent({ content: transformedContent, LinkComponent })}
          </div>
        </div>
      </div>
    </Skeleton>
  )
}

export default ContentLayout
