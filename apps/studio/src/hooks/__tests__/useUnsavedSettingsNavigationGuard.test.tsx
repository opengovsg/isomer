// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useUnsavedSettingsNavigationGuard } from "~/hooks/useUnsavedSettingsNavigationGuard"

vi.mock("next/router", () => ({
  useRouter: () => ({
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  }),
}))

const TestHarness = ({ isDirty }: { isDirty: boolean }) => {
  const { unsavedSettingsModal } = useUnsavedSettingsNavigationGuard(isDirty)
  return <>{unsavedSettingsModal}</>
}

describe("useUnsavedSettingsNavigationGuard", () => {
  it("does not show the modal until navigation is blocked", () => {
    render(<TestHarness isDirty />)

    expect(
      screen.queryByText("Leave this page without saving your settings?"),
    ).not.toBeInTheDocument()
  })
})
