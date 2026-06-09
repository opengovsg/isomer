"use client"

import type { EgazetteAlgoliaSearchProps } from "~/interfaces/internal/EgazetteAlgoliaSearchInputBox"
import { liteClient as algoliasearch } from "algoliasearch/lite"
import { useMemo } from "react"
import { InstantSearch } from "react-instantsearch"

import { createEgazetteRouting } from "./routing"
import { CategoryRefinementList } from "./widgets/CategoryRefinementList"
import { ClearRefinements } from "./widgets/ClearRefinements"
import { CurrentRefinements } from "./widgets/CurrentRefinements"
import { Hits } from "./widgets/Hits"
import { Pagination } from "./widgets/Pagination"
import { RangeInput } from "./widgets/RangeInput"
import { SearchBox } from "./widgets/SearchBox"
import { SortedByLabel } from "./widgets/SortedByLabel"
import { Stats } from "./widgets/Stats"
import { SubCategoryRefinementList } from "./widgets/SubCategoryRefinementList"

interface EgazetteAlgoliaSearchClientProps {
  config: EgazetteAlgoliaSearchProps
}

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="prose-headline-base-semibold text-base-content">{children}</h3>
)

const Divider = () => <hr className="border-t border-base-divider-medium" />

export const EgazetteAlgoliaSearch = ({
  config,
}: EgazetteAlgoliaSearchClientProps) => {
  const searchClient = useMemo(
    () => algoliasearch(config.appId, config.searchApiKey),
    [config.appId, config.searchApiKey],
  )

  const routing = useMemo(
    () => createEgazetteRouting(config.indexName),
    [config.indexName],
  )

  return (
    <InstantSearch
      indexName={config.indexName}
      searchClient={searchClient}
      routing={routing}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <section className="mx-auto flex w-full max-w-screen-xl flex-col gap-8 px-6 py-10 lg:flex-row">
        <aside className="flex w-full flex-col gap-4 lg:w-72 lg:flex-shrink-0">
          <SectionHeading>Search</SectionHeading>
          <SearchBox />

          <SectionHeading>Filter by</SectionHeading>
          <Divider />

          <div className="flex flex-col gap-3">
            <h4 className="prose-headline-base-medium text-base-content">
              Category
            </h4>
            <CategoryRefinementList />
          </div>
          <Divider />

          <SubCategoryRefinementList />

          <div className="flex flex-col gap-3">
            <h4 className="prose-headline-base-medium text-base-content">
              Year
            </h4>
            {/* No explicit bound: useRange derives min/max from the index's
                publishYear facet stats, matching the reference implementation. */}
            <RangeInput attribute="publishYear" minLabel="From" maxLabel="To" />
          </div>
          <Divider />

          <div className="flex flex-col gap-3">
            <h4 className="prose-headline-base-medium text-base-content">
              Month
            </h4>
            {/* No explicit bound: useRange derives min/max from the index's
                publishMonth facet stats, matching the reference implementation. */}
            <RangeInput
              attribute="publishMonth"
              minLabel="From"
              maxLabel="To"
            />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-4">
              <Stats />
              <CurrentRefinements />
              <ClearRefinements />
            </div>
            <SortedByLabel />
          </div>
          <Hits />
          <Pagination />
        </div>
      </section>
    </InstantSearch>
  )
}
