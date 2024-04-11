import type { RelatedArticlesProps } from "~/common"
import { Heading } from "../../../typography/Heading"
import { Caption } from "../../../typography/Caption"

const RelatedArticles = ({
  items,
  LinkComponent = "a",
}: RelatedArticlesProps) => {
  return (
    <div className="flex flex-col w-full">
      <h5
        className={`${Heading["5"]} text-content pb-3.5 border-b-2 border-black`}
      >
        Related articles
      </h5>

      <ul className="divide-y">
        {items.map(({ url, title }, index) => (
          <li key={index}>
            <LinkComponent
              href={url}
              className={`block ${Caption["1"]} text-content-medium py-3.5 hover:bg-interaction-sub hover:text-content-strong active:underline active:underline-offset-2`}
            >
              {title}
            </LinkComponent>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RelatedArticles
