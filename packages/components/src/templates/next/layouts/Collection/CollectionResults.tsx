import type { CollectionPageSchemaType } from "~/types"
import { tv } from "~/lib/tv"

import type { UseCollectionReturn } from "./useCollection"
import { BlogCard } from "../../components/internal/BlogCard"
import { CollectionCard } from "../../components/internal/CollectionCard"

interface CollectionResultProps extends Pick<
  UseCollectionReturn,
  | "paginatedItems"
  | "appliedFilters"
  | "searchValue"
  | "filteredCount"
  | "handleClearFilter"
  | "totalCount"
> {
  shouldShowDate?: boolean
  variant?: CollectionPageSchemaType["page"]["variant"]
  siteAssetsBaseUrl?: string
}

const collection = tv({
  slots: {
    collectionResults: "gap-0 flex-col flex w-full",
  },
  variants: {
    variant: {
      collection: {
        collectionResults: "gap-0 flex-col flex w-full",
      },
      blog: {
        collectionResults:
          // NOTE: we remove the gap so that the blog cards can
          // render their own border between each item
          "grid grid-cols-1 sm:gap-0 md:gap-y-5 md:gap-x-10 md:grid-cols-2",
      },
    },
  },
})

export const CollectionResults = ({
  paginatedItems,
  searchValue,
  appliedFilters,
  filteredCount,
  handleClearFilter,
  totalCount,
  shouldShowDate = true,
  siteAssetsBaseUrl,
  variant = "collection",
}: CollectionResultProps) => {
  const { collectionResults } = collection({ variant })

  if (totalCount === 0) {
    return (
      <p className="prose-body-base py-32 text-center text-base-content">
        There are no articles here.
      </p>
    )
  }

  return (
    <>
      <div className="flex-col gap-y-2 gap-x-6 flex w-full justify-between md:flex-row">
        <div className="gap-3 flex h-full w-full items-center">
          <p className="prose-headline-lg-regular text-base-content-medium">
            {appliedFilters.length > 0 || searchValue !== ""
              ? `${filteredCount} article${filteredCount === 1 ? "" : "s"}`
              : `${filteredCount} article${filteredCount === 1 ? "" : "s"}`}
            {searchValue !== "" && (
              <>
                {" "}
                for "<span className="font-medium">{searchValue}</span>"
              </>
            )}
          </p>
        </div>
      </div>
      {/* NOTE: DO NOT add h-full to this div as it will break old browsers */}
      {paginatedItems.length > 0 ? (
        <div className={collectionResults()}>
          {paginatedItems.map((item) =>
            variant === "collection" ? (
              <CollectionCard
                key={item.id}
                {...item}
                shouldShowDate={shouldShowDate}
                siteAssetsBaseUrl={siteAssetsBaseUrl}
              />
            ) : (
              <BlogCard
                key={item.id}
                {...item}
                shouldShowDate={shouldShowDate}
                siteAssetsBaseUrl={siteAssetsBaseUrl}
              />
            ),
          )}
        </div>
      ) : (
        <div className="flex-col gap-1 flex py-32 text-center text-content">
          <p className="prose-body-base">
            We couldn’t find any articles. Try different search terms or
            filters.
          </p>
          <button
            className="prose-headline-base-medium mx-auto w-fit text-link underline-offset-4 hover:underline"
            onClick={handleClearFilter}
          >
            Clear search and filters
          </button>
        </div>
      )}
    </>
  )
}
