"use client"

import { useLayoutEffect, useState } from "react"

import { NotFoundPageSchemaType } from "~/engine"
import { LinkButton } from "../../components/internal/LinkButton"

type NotFoundSearchButtonProps = Pick<NotFoundPageSchemaType, "LinkComponent">
export const NotFoundSearchButton = ({
  LinkComponent,
}: NotFoundSearchButtonProps) => {
  const [permalink, setPermalink] = useState("")

  useLayoutEffect(() => {
    // The check for typeof window and navigator ensures this only runs in browser environments, not during server-side rendering
    if (
      typeof window !== "undefined" &&
      typeof window.location !== "undefined"
    ) {
      setPermalink(window.location.pathname)
    }
  }, [])

  const lastUrlSegment = permalink.split("/").at(-1) ?? ""
  // NOTE: Replace all non-alphanumeric characters with spaces
  // then remove all spaces and join by `+`.
  // This is because we might have run-on spaces from sequences of symbols
  // like: `+=`, which would lead to 2 spaces
  const missingPath = lastUrlSegment
    .replaceAll(/[\W_]/gi, " ")
    .split(" ")
    .filter((v) => !!v)
    .join("+")

  return (
    <LinkButton
      href={`/search?q=${missingPath}`}
      size="lg"
      variant="outline"
      LinkComponent={LinkComponent}
      isWithFocusVisibleHighlight
    >
      Search for this item
    </LinkButton>
  )
}
