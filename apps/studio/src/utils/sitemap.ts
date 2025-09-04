import type {
  ArticlePageHeaderProps,
  ArticlePagePageProps,
  CollectionPagePageProps,
  FileRefPageProps,
  IsomerSitemap,
  LinkRefPageProps,
} from "@opengovsg/isomer-components"
import { ISOMER_USABLE_PAGE_LAYOUTS } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { Resource } from "~prisma/generated/selectableTypes"
import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"
import { env } from "~/env.mjs"
import { db } from "~/server/modules/database"
import {
  getBlobOfResource,
  getPublishedIndexBlobByParentId,
} from "~/server/modules/resource/resource.service"

type ResourceDto = Omit<
  Resource,
  "id" | "parentId" | "publishedVersionId" | "draftBlobId"
> & {
  id: string
  parentId: string | null
  summary?: string
  thumbnail?: string
}

type CollectionItemResourceDto = Omit<ResourceDto, "type" | "parentId"> & {
  type: typeof ResourceType.CollectionPage | typeof ResourceType.CollectionLink
  parentId: string
}

export const isCollectionItem = (
  resource: ResourceDto,
): resource is CollectionItemResourceDto => {
  return (
    (resource.type === ResourceType.CollectionPage ||
      resource.type === ResourceType.CollectionLink) &&
    !!resource.parentId
  )
}

const getSitemapTreeFromArray = (
  resources: ResourceDto[],
  parentId: string | null,
  path: string,
): IsomerSitemap[] | undefined => {
  if (resources.length === 0) {
    return undefined
  }

  // Get the immediate children of the resource with the given parent ID
  const children = resources.filter((resource) => {
    if (parentId === null) {
      return (
        resource.parentId === null &&
        resource.type !== ResourceType.RootPage &&
        resource.type !== ResourceType.FolderMeta &&
        resource.type !== ResourceType.CollectionMeta
      )
    }
    return (
      resource.parentId === parentId &&
      resource.permalink !== INDEX_PAGE_PERMALINK
    )
  })

  // TODO: Sort the children by the page ordering if the FolderMeta resource exists
  return children.map((resource) => {
    const permalink = `${path}${resource.permalink}`

    if (
      resource.type === ResourceType.Page ||
      resource.type === ResourceType.CollectionPage
    ) {
      return {
        id: resource.id,
        layout: "content", // Note: We are not using the layout field in our sitemap for preview
        title: resource.title,
        summary: resource.summary ?? "",
        lastModified: new Date() // TODO: Update this to the updated_at field in DB
          .toISOString(),
        permalink,
        image: {
          src: resource.thumbnail ?? "",
          alt: "",
        },
      }
    }

    const indexPage = resources.find(
      (child) =>
        child.type === ResourceType.IndexPage &&
        child.permalink === INDEX_PAGE_PERMALINK &&
        child.parentId === resource.id,
    )

    const titleOfPage = indexPage?.title
    const summaryOfPage = indexPage?.summary

    return {
      id: resource.id,
      layout:
        resource.type === ResourceType.Collection
          ? ISOMER_USABLE_PAGE_LAYOUTS.Collection // Needed for collectionblock component to fetch the correct collection
          : ISOMER_USABLE_PAGE_LAYOUTS.Content, // Note: We are not using the layout field in our previews
      title: titleOfPage || resource.title,
      summary: summaryOfPage ?? `Pages in ${resource.title}`,
      lastModified: new Date() // TODO: Update this to the updated_at field in DB
        .toISOString(),
      // NOTE: This permalink is unused in the preview
      permalink,
      image: !!indexPage?.thumbnail
        ? { src: indexPage.thumbnail, alt: "" }
        : undefined,
      children: getSitemapTreeFromArray(
        resources,
        resource.id,
        `${permalink}/`,
      ),
    }
  })
}

// Construct the sitemap tree given an array of individual sitemap items
export const getSitemapTree = (
  rootResource: ResourceDto,
  resources: ResourceDto[],
): IsomerSitemap => {
  return {
    id: String(rootResource.id),
    layout: "homepage", // Note: We are not using the layout field in our previews
    title: rootResource.title,
    summary: "", // Note: We are not using the summary field in our previews
    lastModified: new Date() // TODO: Update this to the updated_at field in DB
      .toISOString(),
    // NOTE: This permalink is unused in the preview
    permalink: "/",
    children: getSitemapTreeFromArray(resources, null, "/"),
  }
}

const NUMBER_OF_CARDS_IN_COLLECTION_BLOCK = 3

export const overwriteCollectionChildrenForCollectionBlock = (
  sitemap: IsomerSitemap,
): IsomerSitemap => {
  // If the current node is a collection, overwrite its children and return
  if (sitemap.layout === ISOMER_USABLE_PAGE_LAYOUTS.Collection) {
    return {
      ...sitemap,
      children: Array.from({ length: NUMBER_OF_CARDS_IN_COLLECTION_BLOCK }).map(
        (_, idx) => ({
          id: `collection-card-${idx}`,
          title: "Article title",
          summary: "Article summary",
          permalink: "/",
          layout: ISOMER_USABLE_PAGE_LAYOUTS.Article,
          lastModified: new Date().toISOString(),
          category: "Category of article",
          ref: "/",
          image: {
            src: `${env.NEXT_PUBLIC_APP_URL}/assets/collectionblock_studio_preview.svg`,
            alt: "Placeholder image for article's thumbnail",
          },
        }),
      ),
    }
  }

  let processedChildren = sitemap.children

  // If the node is not a collection, process its children (if any)
  if (sitemap.children) {
    processedChildren = sitemap.children.map((child) =>
      overwriteCollectionChildrenForCollectionBlock(child),
    )
  }

  // Return the non-collection node with potentially updated children
  return {
    ...sitemap,
    children: processedChildren,
  }
}

export const injectTagMappings = async (
  sitemapTree: IsomerSitemap,
  resource: CollectionItemResourceDto,
): Promise<IsomerSitemap> => {
  // NOTE: if the resource's parent is a collection,
  // we need to inject the tagged property into the returned sitemap
  // as well as the `tagCategories` property on the parent
  const draftBlobOfResource = await getBlobOfResource({
    db,
    resourceId: resource.id,
  })

  const publishedIndexBlob = await getPublishedIndexBlobByParentId({
    db,
    resourceId: resource.parentId,
  })

  return _injectTagMappings(
    sitemapTree,
    // NOTE: This cast is abit overkill,
    // but earlier on we validated this item
    // as only being part of a collection,
    // not the exact type so for safety,
    // we cast to all the possible `page` props
    // of a collection item
    (
      draftBlobOfResource.content.page as
        | ArticlePagePageProps
        | FileRefPageProps
        | LinkRefPageProps
    ).tagged,
    (publishedIndexBlob.content.page as unknown as CollectionPagePageProps)
      .tagCategories,
    resource.id,
    resource.parentId,
  )
}

// NOTE: Private helper method for `injectTagMappings`
const _injectTagMappings = (
  sitemap: IsomerSitemap,
  tagged: ArticlePagePageProps["tagged"],
  tagCategories: CollectionPagePageProps["tagCategories"],
  childId: CollectionItemResourceDto["id"],
  collectionId: CollectionItemResourceDto["parentId"],
): IsomerSitemap => {
  // NOTE: If the child id matches,
  // just inject the tags
  if (sitemap.id === childId) {
    return { ...sitemap, tagged }
  }

  // NOTE: If the collection id matches,
  // inject tag categories and process the children
  if (
    sitemap.layout === ISOMER_USABLE_PAGE_LAYOUTS.Collection &&
    sitemap.id === collectionId
  ) {
    return {
      ...sitemap,
      collectionPagePageProps: {
        ...sitemap.collectionPagePageProps,
        tagCategories,
      },
      children: sitemap.children?.map((child) =>
        _injectTagMappings(child, tagged, tagCategories, childId, collectionId),
      ),
    }
  }

  // NOTE: Otherwise, just continue traversing the tree
  // until we hit the collection
  return {
    ...sitemap,
    children: sitemap.children?.map((child) =>
      _injectTagMappings(child, tagged, tagCategories, childId, collectionId),
    ),
  }
}
