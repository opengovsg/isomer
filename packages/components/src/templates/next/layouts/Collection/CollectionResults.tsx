import type { UseCollectionReturn } from "./useCollection"
import type { CollectionPageSchemaType, CollectionVariant } from "~/types"
import { tv } from "~/lib/tv"
import { BlogCard, CollectionCard } from "../../components/internal"

interface CollectionResultProps
  extends Pick<
    UseCollectionReturn,
    | "paginatedItems"
    | "appliedFilters"
    | "searchValue"
    | "filteredCount"
    | "handleClearFilter"
    | "totalCount"
  > {
  shouldShowCategory?: boolean
  shouldShowDate?: boolean
  variant?: CollectionVariant
  siteAssetsBaseUrl: string | undefined
  LinkComponent: CollectionPageSchemaType["LinkComponent"]
}

const collection = tv(
  {
    slots: {
      collectionResults: "flex w-full flex-col gap-0",
    },
    variants: {
      variant: {
        collection: {
          collectionResults: "flex w-full flex-col gap-0",
        },
        blog: {
          collectionResults:
            // NOTE: we remove the gap so that the blog cards can
            // render their own border between each item
            "grid grid-cols-1 sm:gap-0 md:grid-cols-2 md:gap-5",
        },
      },
    },
  },
  { responsiveVariants: ["md", "sm", "lg"] },
)

export const CollectionResults = ({
  paginatedItems,
  searchValue,
  appliedFilters,
  filteredCount,
  handleClearFilter,
  totalCount,
  shouldShowCategory = true,
  shouldShowDate = true,
  siteAssetsBaseUrl,
  LinkComponent,
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
      <div className="flex w-full flex-col justify-between gap-x-6 gap-y-2 md:flex-row">
        <div className="flex h-full w-full items-center gap-3">
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
      <div className={collectionResults()}>
        {paginatedItems.length > 0 &&
          paginatedItems.map((item) =>
            variant === "collection" ? (
              <CollectionCard
                key={`${item.title}-${item.category}`}
                {...item}
                shouldShowCategory={shouldShowCategory}
                shouldShowDate={shouldShowDate}
                siteAssetsBaseUrl={siteAssetsBaseUrl}
                LinkComponent={LinkComponent}
              />
            ) : (
              <BlogCard
                key={`${item.title}-${item.category}`}
                {...item}
                shouldShowCategory={shouldShowCategory}
                shouldShowDate={shouldShowDate}
                siteAssetsBaseUrl={siteAssetsBaseUrl}
                LinkComponent={LinkComponent}
              />
            ),
          )}
        {paginatedItems.length === 0 && (
          <div className="flex flex-col gap-1 py-32 text-center text-content">
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
      </div>
    </>
  )
}
