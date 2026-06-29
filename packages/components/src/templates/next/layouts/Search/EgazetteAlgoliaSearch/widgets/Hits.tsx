import { BiFile } from "react-icons/bi"
import { Highlight, Snippet, useHits } from "react-instantsearch"
import { Link } from "~/templates/next/components/internal/Link"
import { getFormattedDate } from "~/utils/getFormattedDate"

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
  return getFormattedDate(new Date(timestamp).toISOString())
}

export const Hits = () => {
  const { items } = useHits<EgazetteHit>()

  if (items.length === 0) return null

  return (
    <ul className="divide-base-divider-medium flex flex-col divide-y">
      {items.map((hit) => (
        <li key={hit.objectID} className="flex flex-col gap-2 py-5">
          <h5 className="prose-headline-lg-semibold text-base-content-strong">
            <Link
              href={hit.fileUrl}
              isExternal
              className="text-link hover:text-link-hover flex items-start gap-2"
            >
              <BiFile
                aria-hidden
                className="text-base-content mt-0.5 size-6 shrink-0"
              />
              <span className="underline underline-offset-2">
                <Highlight attribute="title" hit={hit} />
              </span>
            </Link>
          </h5>
          <div className="flex flex-col gap-2 pl-8">
            <p className="prose-body-base text-base-content">
              Category: <Highlight attribute="category" hit={hit} />
              {hit.subCategory && (
                <>
                  , Sub-Category:{" "}
                  <Highlight attribute="subCategory" hit={hit} />
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
          </div>
        </li>
      ))}
    </ul>
  )
}
