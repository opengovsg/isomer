// @vitest-environment jsdom

import type { IsomerComponent } from "@opengovsg/isomer-components"
import type { PropsWithChildren } from "react"
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { AdjustmentPreview } from "../AdjustmentPreview"

// Render the frame's children inline. The real iframe needs the built preview
// CSS and a site theme.
vi.mock(
  "~/features/editing-experience/components/preview/PreviewIframe",
  () => ({
    PreviewIframe: ({ children }: PropsWithChildren) => <div>{children}</div>,
  }),
)
vi.mock("next/router", () => ({
  useRouter: () => ({ query: {}, isReady: true }),
}))
vi.mock("~/hooks/useSiteThemeCssVars", () => ({
  useSiteThemeCssVars: () => ({}),
}))
// The original never loads, so the preview shows the current image.
vi.mock("../useSaveImageAdjustment", () => ({
  chooseBakeMime: vi.fn(),
  fetchImageBlob: () => new Promise(() => undefined),
}))
vi.mock("@opengovsg/isomer-components", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  renderComponent: () => <span>rendered block</span>,
}))

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  )
})

describe("AdjustmentPreview", () => {
  it("renders the built component inside the builder's wrapPreview", () => {
    const block = { type: "hero", variant: "gradient" } as IsomerComponent

    render(
      <AdjustmentPreview
        src="/1/uuid/file.png"
        originalSrc="/1/uuid/file.png"
        previewStates={[{ id: "desktop", label: "Desktop" }]}
        block={block}
        fieldHost={block as unknown as Record<string, unknown>}
        imageFieldName="backgroundUrl"
        buildPreview={() => ({
          component: block,
          wrapPreview: (children) => (
            <div data-testid="wrapper">{children}</div>
          ),
        })}
        siteId={1}
      />,
    )

    expect(screen.getByTestId("wrapper").textContent).toBe("rendered block")
  })
})
