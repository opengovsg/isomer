import type { UseCollectionReturn } from "./useCollection"
import type { CollectionPageSchemaType } from "~/types"
import { CollectionCard } from "../../components/internal"

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
  LinkComponent: CollectionPageSchemaType["LinkComponent"]
}

export const CollectionResults = ({
  paginatedItems,
  searchValue,
  appliedFilters,
  filteredCount,
  handleClearFilter,
  totalCount,
  LinkComponent,
}: CollectionResultProps) => {
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
              ? `${filteredCount} search result${
                  filteredCount === 1 ? "" : "s"
                }`
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
      <div className="flex h-full w-full flex-col gap-0">
        {paginatedItems.length > 0 &&
          paginatedItems.map((item) => (
            <CollectionCard
              key={Math.random()}
              {...item}
              LinkComponent={LinkComponent}
            />
          ))}
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
