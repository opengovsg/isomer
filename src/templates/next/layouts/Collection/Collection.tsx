import { useState } from "react"
import type { CollectionPageSchema } from "~/engine"
import { CollectionCard } from "../../components"
import { Heading } from "../../typography/Heading"
import { Paragraph } from "../../typography/Paragraph"
import { Skeleton } from "../Skeleton"
import type { Filter as FilterType, AppliedFilter } from "../../types/Filter"
import { CollectionSearch, Filter, Pagination } from "../../components/shared"

const extractCategories = (
  items: CollectionPageSchema["page"]["items"],
): Record<string, number> => {
  const categories: Record<string, number> = {}
  items.forEach((item) => {
    if (item.category in categories) {
      categories[item.category] += 1
    } else {
      categories[item.category] = 1
    }
  })
  return categories
}

const getFilters = (categories: Record<string, number>): FilterType[] => {
  return [
    {
      id: "category",
      label: "Category",
      items: Object.entries(categories).map(([label, count]) => ({
        id: label.toLowerCase(),
        label,
        count,
      })),
    },
  ]
}

const getFilteredResults = (
  items: CollectionPageSchema["page"]["items"],
  appliedFilters: AppliedFilter[],
  search: string,
  itemsPerPage: number,
  currPage: number,
): CollectionPageSchema["page"]["items"] => {
  const filteredItems = items.filter((item) => {
    if (
      search !== "" &&
      !item.title.toLowerCase().includes(search.toLowerCase()) &&
      !item.description.toLowerCase().includes(search.toLowerCase())
    ) {
      return false
    }

    for (const filter of appliedFilters) {
      if (filter.id === "category") {
        if (
          !filter.items.some(
            (appliedFilterItem) =>
              appliedFilterItem.id === item.category.toLowerCase(),
          )
        ) {
          return false
        }
      }
    }
    return true
  })

  return filteredItems.slice(
    (currPage - 1) * itemsPerPage,
    currPage * itemsPerPage,
  )
}

const CollectionLayout = ({
  site,
  page,
  content,
  LinkComponent,
}: CollectionPageSchema) => {
  const ITEMS_PER_PAGE = 6
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([])
  const [search, setSearch] = useState<string>("")
  const [currPage, setCurrPage] = useState<number>(1)

  const filters = getFilters(extractCategories(page.items))
  const filteredResults = getFilteredResults(
    page.items,
    appliedFilters,
    search,
    ITEMS_PER_PAGE,
    currPage,
  )

  return (
    <Skeleton site={site} page={page}>
      <div className="max-w-[1136px] flex flex-col gap-16 mx-auto my-20 items-center">
        <div className="flex flex-col gap-12">
          <h1
            className={`flex flex-col gap-16 text-content-strong ${Heading[1]}`}
          >
            {page.title}
          </h1>
          <p className={`${Paragraph[1]} text-content`}>{page.subtitle}</p>
        </div>
        <div className="w-3/4 ml-auto mr-auto">
          <CollectionSearch
            placeholder="Search for a publication" // TODO: Use collection name
            search={search}
            setSearch={setSearch}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-10 justify-between w-full">
          <div className="w-full sm:w-1/6">
            <Filter
              filters={filters} // TODO: Add filters here
              appliedFilters={appliedFilters}
              setAppliedFilters={setAppliedFilters}
            />
          </div>
          <div className="flex flex-col gap-6 w-full sm:w-5/6">
            <div className="flex justify-between w-full items-end">
              <p className={`${Paragraph[1]} text-content`}>
                {appliedFilters.length > 0 || search !== ""
                  ? `${filteredResults.length} search ${
                      filteredResults.length === 1 ? "result" : "results"
                    }`
                  : `${page.items.length} ${
                      page.items.length === 1 ? "article" : "articles"
                    }`}
              </p>
              <div className="flex flex-col gap-2">
                <p className={`${Paragraph[2]} text-content-strong`}>Sort by</p>
                <div>Sort dropdown placeholder</div>
              </div>
            </div>
            <div className="flex flex-col gap-0">
              {filteredResults.map((item) => (
                <CollectionCard {...item} LinkComponent={LinkComponent} />
              ))}
            </div>
          </div>
        </div>
        <div className="w-full">
          <div className="sm:max-w-96 sm:ml-auto">
            <Pagination
              totalItems={page.items.length}
              itemsPerPage={ITEMS_PER_PAGE}
              currPage={currPage}
              setCurrPage={setCurrPage}
            />
          </div>
        </div>
      </div>
    </Skeleton>
  )
}

export default CollectionLayout
