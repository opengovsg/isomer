import type { CollectionPageSchema } from "~/engine"
import { Skeleton } from "../Skeleton"
import { Heading } from "../../typography/Heading"
import { Paragraph } from "../../typography/Paragraph"
import { CollectionCard } from "../../components"

const CollectionLayout = ({
  site,
  meta,
  props,
  content,
  LinkComponent,
}: CollectionPageSchema) => {
  return (
    <Skeleton site={site} meta={meta}>
      <div className="max-w-[1136px] flex flex-col gap-16 mx-auto my-20 items-center">
        <div className="flex flex-col gap-12">
          <h1
            className={`flex flex-col gap-16 text-content-strong ${Heading[1]}`}
          >
            {props.title}
          </h1>
          <p className={`${Paragraph[1]} text-content`}>{props.subtitle}</p>
        </div>
        <div>Search placeholder</div>
        <div className="flex gap-10 justify-between w-full">
          <div className="max-w-[260px]">Filter placeholder</div>
          <div className="flex flex-col gap-6">
            <div className="flex justify-between w-full items-end">
              <p className={`${Paragraph[1]} text-content`}>
                {props.items.length} articles
              </p>
              <div className="flex flex-col gap-2">
                <p className={`${Paragraph[2]} text-content-strong`}>Sort by</p>
                <div>Sort dropdown placeholder</div>
              </div>
            </div>
            <div className="flex flex-col gap-0">
              {props.items.map((item) => (
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
