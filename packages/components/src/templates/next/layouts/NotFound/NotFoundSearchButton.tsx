"use client"

import { useEffect, useState } from "react"
import { getWordsFromPermalink } from "~/utils/getWordsFromPermalink"

import { LinkButton } from "../../components/internal/LinkButton"

export const NotFoundSearchButton = () => {
  const [permalink, setPermalink] = useState("")

  useEffect(() => {
    // The check for typeof window and navigator ensures this only runs in browser environments, not during server-side rendering
    if (
      typeof window !== "undefined" &&
      typeof window.location !== "undefined"
    ) {
      setPermalink(window.location.pathname)
    }
  }, [])

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
