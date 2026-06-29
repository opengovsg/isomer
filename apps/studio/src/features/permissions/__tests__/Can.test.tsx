// @vitest-environment jsdom
import type { ResourceAbility } from "~/server/modules/permissions/permissions.type"
import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import { AbilityProvider } from "@casl/react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Can } from "~/features/permissions"

// These tests lock the @casl/react <Can> contract that our permission gates rely
// on. @casl/react v7 changed the render-prop from a positional boolean
// `(isAllowed, ability) => ...` to a single object `({ isAllowed, ... }) => ...`;
// consuming it the old way made the argument always truthy and silently leaked
// gated UI. If a future upgrade changes the shape again, these tests fail loudly
// instead of every <Can passThrough> gate failing open in production.
const buildAbility = () => {
  const builder = new AbilityBuilder<ResourceAbility>(createMongoAbility)
  // Allow publish, deny everything else (e.g. delete).
  builder.can("publish", "Resource")
  return builder.build({ detectSubjectType: () => "Resource" })
}

const renderWithAbility = (ui: React.ReactNode) =>
  render(<AbilityProvider value={buildAbility()}>{ui}</AbilityProvider>)

describe("<Can> render-prop contract", () => {
  it("passes a single object exposing `isAllowed`, not a positional boolean", () => {
    let received: unknown
    renderWithAbility(
      <Can do="publish" on="Resource" passThrough>
        {(arg) => {
          received = arg
          return null
        }}
      </Can>,
    )

    expect(typeof received).toBe("object")
    expect(received).toMatchObject({ isAllowed: true })
  })

  it("reports `isAllowed: false` for a denied action", () => {
    let received: unknown
    renderWithAbility(
      <Can do="delete" on="Resource" passThrough>
        {(arg) => {
          received = arg
          return null
        }}
      </Can>,
    )

    expect(received).toMatchObject({ isAllowed: false })
  })
})

describe("<Can> node-child gating", () => {
  it("renders children when the action is allowed", () => {
    renderWithAbility(
      <Can do="publish" on="Resource">
        <span>allowed content</span>
      </Can>,
    )

    expect(screen.queryByText("allowed content")).not.toBeNull()
  })

  it("hides children when the action is denied", () => {
    renderWithAbility(
      <Can do="delete" on="Resource">
        <span>denied content</span>
      </Can>,
    )

    expect(screen.queryByText("denied content")).toBeNull()
  })
})
