import { useState } from "react"
import { CollectionCardProps } from "~/common"
import { SortDirection, SortKey } from "~/common/CollectionSort"
import type { CollectionPageSchema } from "~/engine"
import { CollectionCard } from "../../components"
import CollectionSort from "../../components/CollectionSort"
import { Heading } from "../../typography/Heading"
import { Paragraph } from "../../typography/Paragraph"
import { Skeleton } from "../Skeleton"

const sortItems = (
  items: CollectionCardProps[],
  sortBy: SortKey,
  sortDirection: SortDirection,
) => {
  return items.sort((a, b) => {
    if (sortBy === "date") {
      const dateA = new Date(a.lastUpdated)
      const dateB = new Date(b.lastUpdated)
      return sortDirection === "asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime()
    }
    return 0
  })
}

const CollectionLayout = ({
  site,
  page,
  content,
  LinkComponent,
}: CollectionPageSchema) => {
  const [sortBy, setSortBy] = useState<SortKey>(page.defaultSortBy)
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    page.defaultSortDirection,
  )
  const sortedItems = sortItems(page.items, sortBy, sortDirection)
  return (
    <Skeleton site={site} page={page}>
      <div className="max-w-[1140px] flex flex-col gap-16 mx-auto my-20 items-center">
        <div className="flex flex-col gap-12">
          <h1
            className={`flex flex-col gap-16 text-content-strong ${Heading[1]}`}
          >
            {page.title}
          </h1>
          <p className={`${Paragraph[1]} text-content`}>{page.subtitle}</p>
        </div>
        <div>Search placeholder</div>
        <div className="flex gap-10 justify-between w-full">
          <div className="max-w-[260px]">Filter placeholder</div>
          <div className="flex flex-col gap-6">
            <div className="flex justify-between w-full items-end">
              <p className={`${Paragraph[1]} text-content`}>
                {page.items.length} articles
              </p>
              <div className="w-[260px]">
                <CollectionSort
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  sortDirection={sortDirection}
                  setSortDirection={setSortDirection}
                />
              </div>
            </div>
            <div className="flex flex-col gap-0">
              {sortedItems.map((item) => (
                <CollectionCard {...item} LinkComponent={LinkComponent} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Skeleton>
  )
}

export default CollectionLayout
