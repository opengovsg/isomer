import { Highlight, Snippet, useHits } from "react-instantsearch"

interface EgazetteHit {
  fileUrl: string
  title: string
  category: string
  subCategory?: string
  notificationNum?: string
  publishTimestamp: number
  text?: string
}

const formatDate = (timestamp: number) => {
  if (!Number.isFinite(timestamp)) return ""
  return new Date(timestamp).toLocaleDateString("en-SG")
}

export const Hits = () => {
  const { items } = useHits<EgazetteHit>()

  if (items.length === 0) return null

  return (
    <ul className="flex flex-col gap-6">
      {items.map((hit) => (
        <li key={hit.objectID} className="flex flex-col gap-2">
          <a
            href={hit.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            type="application/pdf"
            className="prose-headline-lg-medium text-link underline underline-offset-2 hover:text-link-hover"
          >
            <Highlight attribute="title" hit={hit} />
          </a>
          <p className="prose-body-base text-base-content">
            Category: <Highlight attribute="category" hit={hit} />
            {hit.subCategory && (
              <>
                , Sub-Category: <Highlight attribute="subCategory" hit={hit} />
              </>
            )}
          </p>
          {hit.notificationNum && (
            <p className="prose-body-base text-base-content">
              Number: <Highlight attribute="notificationNum" hit={hit} />
            </p>
          )}
          <p className="prose-body-base text-base-content">
            Date of publication: {formatDate(hit.publishTimestamp)}
          </p>
          {hit.text && (
            <p className="prose-body-base text-base-content">
              Content: <Snippet attribute="text" hit={hit} />
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
