"use client"

import { NotFoundPageSchemaType } from "~/engine"
import { LinkButton } from "../../components/internal/LinkButton"

type NotFoundSearchButtonProps = Pick<NotFoundPageSchemaType, "LinkComponent">
export const NotFoundSearchButton = ({
  LinkComponent,
}: NotFoundSearchButtonProps) => {
  const permalink = window.location.pathname
  const lastUrlSegment = permalink.split("/").at(-1) ?? ""
  // NOTE: Replace all non-alphanumeric characters with spaces
  // then remove all spaces and join by `+`.
  // This is because we might have run-on spaces from sequences of symbols
  // like: `+=`, which would lead to 2 spaces
  const missingPath = lastUrlSegment
    .replaceAll(/\W_/gi, " ")
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
