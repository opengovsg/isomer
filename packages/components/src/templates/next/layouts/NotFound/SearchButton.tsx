"use client"

import { useEffect, useState } from "react"

import type { NotFoundPageSchemaType } from "~/engine"
import { getWordsFromPermalink } from "~/utils"
import { LinkButton } from "../../components/internal/LinkButton"

type NotFoundSearchButtonProps = Pick<NotFoundPageSchemaType, "LinkComponent">
export const NotFoundSearchButton = ({
  LinkComponent,
}: NotFoundSearchButtonProps) => {
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
      LinkComponent={LinkComponent}
      isWithFocusVisibleHighlight
    >
      Search for this page
    </LinkButton>
  )
}
