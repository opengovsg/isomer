import { render, waitFor } from "@testing-library/react"
import { useRef, useState } from "react"
import { describe, expect, it } from "vitest"

import { PreviewIframe } from "../../preview/PreviewIframe"
import { useSyncedScroll } from "../useSyncedScroll"

const TallPage = () => <div style={{ height: "5000px" }}>Tall page</div>

const Harness = () => {
  const [beforeDocument, setBeforeDocument] = useState<Document | null>(null)
  const [afterDocument, setAfterDocument] = useState<Document | null>(null)
  const beforePaneRef = useRef<HTMLDivElement>(null)
  const afterPaneRef = useRef<HTMLDivElement>(null)
  useSyncedScroll({
    beforePaneRef,
    afterPaneRef,
    beforeDocument,
    afterDocument,
  })

  return (
    <div style={{ display: "flex", height: "400px" }}>
      <div ref={beforePaneRef} data-testid="before-pane" style={{ flex: 1 }}>
        <PreviewIframe
          callback={({ document }) => setBeforeDocument(document ?? null)}
        >
          <TallPage />
        </PreviewIframe>
      </div>
      <div ref={afterPaneRef} data-testid="after-pane" style={{ flex: 1 }}>
        <PreviewIframe
          callback={({ document }) => setAfterDocument(document ?? null)}
        >
          <TallPage />
        </PreviewIframe>
      </div>
    </div>
  )
}

const renderPanes = async () => {
  const { getByTestId } = render(<Harness />)
  const getWindow = (testId: string) =>
    getByTestId(testId).querySelector("iframe")?.contentWindow

  await waitFor(() => {
    expect(getWindow("before-pane")?.document.body.textContent).toContain(
      "Tall page",
    )
    expect(getWindow("after-pane")?.document.body.textContent).toContain(
      "Tall page",
    )
  })

  return {
    beforeWindow: getWindow("before-pane")!,
    afterWindow: getWindow("after-pane")!,
  }
}

describe("useSyncedScroll", () => {
  it("scrolls the after pane when the before pane scrolls", async () => {
    const { beforeWindow, afterWindow } = await renderPanes()

    beforeWindow.scrollTo(0, 1200)

    await waitFor(() => {
      expect(afterWindow.scrollY).toBe(1200)
    })
  })

  it("scrolls the before pane when the after pane scrolls", async () => {
    const { beforeWindow, afterWindow } = await renderPanes()

    afterWindow.scrollTo(0, 800)

    await waitFor(() => {
      expect(beforeWindow.scrollY).toBe(800)
    })
  })
})
