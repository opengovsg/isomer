import type { IsomerSchema, ProseProps } from "@opengovsg/isomer-components"
import type { EditorEvents, JSONContent } from "@tiptap/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { act, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { EditorDrawerProvider } from "~/contexts/EditorDrawerContext"
import { theme } from "~/theme"
import { ResourceType } from "~prisma/generated/generatedEnums"

import TipTapProseComponent from "../TipTapProseComponent"

const noop = vi.hoisted(() => vi.fn())

const editorCallbacks = vi.hoisted(() => ({
  handleChange: undefined as
    | ((content: JSONContent | undefined) => void)
    | undefined,
  onContentError: undefined as
    | ((props: EditorEvents["contentError"]) => void)
    | undefined,
}))

vi.mock("next/router", () => ({
  useRouter: () => ({ query: { pageId: "1", siteId: "1" } }),
}))

vi.mock("~/utils/trpc", () => ({
  trpc: {
    page: {
      updatePageBlob: {
        useMutation: () => ({ mutate: noop, isPending: false }),
      },
    },
    useUtils: () => ({
      page: {
        readPage: { invalidate: noop },
        readPageAndBlob: { invalidate: noop },
      },
    }),
  },
}))

vi.mock("../../hooks/useTextEditor", () => ({
  useTextEditor: ({
    handleChange,
    onContentError,
  }: {
    handleChange: (content: JSONContent | undefined) => void
    onContentError?: (props: EditorEvents["contentError"]) => void
  }) => {
    editorCallbacks.handleChange = handleChange
    editorCallbacks.onContentError = onContentError
    return {}
  },
}))

vi.mock("../form-builder/renderers/TipTapEditor", () => ({
  TiptapTextEditor: () => <div data-testid="tiptap-editor" />,
}))

const VALID_PROSE = {
  type: "prose" as const,
  content: [
    {
      type: "paragraph" as const,
      content: [{ type: "text" as const, text: "Hello world" }],
    },
  ],
}

const PAGE_STATE: IsomerSchema = {
  version: "0.1.0",
  layout: "content",
  page: { title: "About us", description: "About us" },
  content: [VALID_PROSE],
}

const renderComponent = () =>
  render(
    <ThemeProvider theme={theme}>
      <EditorDrawerProvider
        initialPageState={PAGE_STATE}
        type={ResourceType.Page}
        permalink="/about"
        siteId={1}
        pageId={1}
        updatedAt={new Date()}
        title="About us"
      >
        <TipTapProseComponent content={VALID_PROSE as ProseProps} />
      </EditorDrawerProvider>
    </ThemeProvider>,
  )

describe("TipTapProseComponent", () => {
  it("keeps Save disabled after a TipTap schema error even if later content is valid prose", () => {
    // Arrange
    renderComponent()
    const saveButton = screen.getByRole("button", { name: "Save changes" })
    expect(saveButton).toBeEnabled()

    // Act
    act(() => {
      editorCallbacks.onContentError?.({
        error: new Error("invalid schema"),
      } as EditorEvents["contentError"])
    })
    act(() => {
      editorCallbacks.handleChange?.(VALID_PROSE)
    })

    // Assert
    expect(saveButton).toBeDisabled()
  })
})
