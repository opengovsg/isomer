"use client"

import { useEffect, useState } from "react"

import type { NotFoundPageSchemaType } from "~/types"
import { getWordsFromPermalink } from "~/utils"
import { getSimilarSitemapMatches } from "~/utils/getSimilarSitemapMatches"
import { getSitemapAsArray } from "~/utils/getSitemapAsArray"
import { Link } from "../../components/internal/Link"
import { LinkButton } from "../../components/internal/LinkButton"

type SimilarMatch = ReturnType<typeof getSimilarSitemapMatches>[number]

interface NotFoundSimilarMatchesProps {
  site: NotFoundPageSchemaType["site"]
  LinkComponent: NotFoundPageSchemaType["LinkComponent"]
  descriptionClassName: string
  buttonContainerClassName: string
}

export const NotFoundSimilarMatches = ({
  site,
  LinkComponent,
  descriptionClassName,
  buttonContainerClassName,
}: NotFoundSimilarMatchesProps) => {
  const [similarMatches, setSimilarMatches] = useState<SimilarMatch[]>([])
  const [permalink, setPermalink] = useState("")

  useEffect(() => {
    // Ensure this only runs in browser environments, not during server-side rendering
    if (
      typeof window === "undefined" ||
      window.location.pathname === "undefined"
    )
      return

    const currentPath = window.location.pathname

    setPermalink(currentPath)

    const matches = getSimilarSitemapMatches({
      sitemap: getSitemapAsArray(site.siteMap),
      query: currentPath,
    })
    setSimilarMatches(matches)
  }, [site.siteMap])

  const hasMatches = similarMatches.length > 0
  const missingPath = getWordsFromPermalink(permalink)

  return (
    <>
      <p className={descriptionClassName}>
        {hasMatches
          ? "This page might have been moved or deleted. Did you mean one of these?"
          : "This page might have been moved or deleted. Try searching for this page instead."}
      </p>
      {hasMatches && (
        <ul className="flex flex-col gap-6">
          {similarMatches.map((match) => (
            <li key={match.item.entity.permalink}>
              <Link
                href={match.item.entity.permalink}
                className="group flex flex-col gap-1 outline-0"
                LinkComponent={LinkComponent}
              >
                <span className="prose-headline-lg-semibold text-brand-interaction underline-offset-4 group-hover:text-brand-canvas-inverse group-hover:underline">
                  {match.item.entity.title}
                </span>
                <span className="prose-body-sm text-base-content-subtle">
                  {match.item.entity.permalink}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className={buttonContainerClassName}>
        <LinkButton
          href={`/search?q=${missingPath}`}
          size="lg"
          LinkComponent={LinkComponent}
          isWithFocusVisibleHighlight
        >
          {hasMatches ? "Search" : "Search for this page"}
        </LinkButton>
        <LinkButton
          href="/"
          size="lg"
          variant="outline"
          LinkComponent={LinkComponent}
          isWithFocusVisibleHighlight
        >
          Go to homepage
        </LinkButton>
      </div>
    </>
  )
}
