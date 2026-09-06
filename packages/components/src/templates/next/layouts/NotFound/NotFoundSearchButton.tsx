"use client"

import { useSyncExternalStore } from "react"
import { getWordsFromPermalink } from "~/utils/getWordsFromPermalink"

import { LinkButton } from "../../components/internal/LinkButton"

const getPathnameSnapshot = () => window.location.pathname
const getPathnameServerSnapshot = () => ""

const subscribeToStaticSnapshot = () => {
  return () => undefined
}

export const NotFoundSearchButton = () => {
  const permalink = useSyncExternalStore(
    subscribeToStaticSnapshot,
    getPathnameSnapshot,
    getPathnameServerSnapshot,
  )

  const missingPath = getWordsFromPermalink(permalink)

  return (
    <LinkButton
      href={`/search?q=${missingPath}`}
      size="lg"
      isWithFocusVisibleHighlight
    >
      Search for this page
    </LinkButton>
  )
}
