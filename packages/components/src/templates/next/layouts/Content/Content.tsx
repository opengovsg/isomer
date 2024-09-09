import type { ContentPageSchemaType } from "~/engine"
import { tv } from "~/lib/tv"
import {
  getBreadcrumbFromSiteMap,
  getDigestFromText,
  getRandomNumberBetIntervals,
  getSiderailFromSiteMap,
  getTextAsHtml,
} from "~/utils"
import {
  BackToTopLink,
  ContentPageHeader,
  Siderail,
  TableOfContents,
} from "../../components/internal"
import { renderPageContent } from "../../render"
import { Skeleton } from "../Skeleton"

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
            const newAttrs = {
              ...component.attrs,
              id: anchorId,
            }

            return { ...component, attrs: newAttrs }
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
      "mx-auto grid max-w-screen-xl grid-cols-12 px-6 py-12 md:px-10 md:py-16 lg:gap-6 xl:gap-10",
    siderailContainer: "relative col-span-3 hidden lg:block",
    content: "col-span-12 flex flex-col gap-16",
  },
  variants: {
    isSideRailPresent: {
      true: {
        content: "lg:col-span-9 lg:ml-24",
      },
      false: {
        content: "max-w-[54rem]",
      },
    },
  },
})

const compoundStyles = createContentLayoutStyles()

const ContentLayout = ({
  site,
  page,
  layout,
  content,
  LinkComponent = "a",
  ScriptComponent,
}: ContentPageSchemaType) => {
  const isParentPageRoot = page.permalink.split("/").length === 2

  // Note: We do not show side rail for first-level pages
  const sideRail = !isParentPageRoot
    ? getSiderailFromSiteMap(site.siteMap, page.permalink.split("/").slice(1))
    : null

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
      layout={layout}
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
            <BackToTopLink LinkComponent={LinkComponent} />
          </div>
        )}

        <div
          className={compoundStyles.content({ isSideRailPresent: !!sideRail })}
        >
          {tableOfContents.items.length > 1 && (
            <TableOfContents {...tableOfContents} />
          )}
          <div>
            {renderPageContent({
              site,
              content: transformedContent,
              LinkComponent,
            })}
          </div>
        </div>
      </div>
    </Skeleton>
  )
}

export default ContentLayout
