import type { IsomerSchema, ProseProps } from "@opengovsg/isomer-components"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { EditorDrawerProvider } from "~/contexts/EditorDrawerContext"
import { theme } from "~/theme"
import { ResourceType } from "~prisma/generated/generatedEnums"

import TipTapProseComponent from "../TipTapProseComponent"

const noop = vi.hoisted(() => vi.fn())

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
  useTextEditor: () => ({}),
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

const renderComponent = (content: ProseProps) =>
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
        <TipTapProseComponent content={content} />
      </EditorDrawerProvider>
    </ThemeProvider>,
  )

describe("TipTapProseComponent", () => {
  it("enables Save for schema-valid prose content", () => {
    renderComponent(VALID_PROSE as ProseProps)

    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled()
  })

  it("disables Save when prose content fails schema validation", () => {
    renderComponent({
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥" }],
        },
      ],
    } as ProseProps)

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
  })
})
