import type { IsomerSchema } from "@opengovsg/isomer-components"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { EditorDrawerProvider } from "~/contexts/EditorDrawerContext"
import { theme } from "~/theme"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { PageDiffModal } from "../PageDiffModal"

const noop = vi.hoisted(() => vi.fn())

// Pulled in transitively (via the preview render chain) even though this
// test never calls `useRouter` directly — mocked for the same reason as in
// HistoryStateDrawer.browser.test.tsx: Vite's dependency pre-bundler needs to
// resolve the real "next/router" module unless it's mocked, and evaluating
// it in Vitest's real-browser (Chromium) mode throws ("process is not
// defined") since it isn't Next's own webpack build performing the usual
// `process.env.*` inlining.
vi.mock("next/router", () => ({
  useRouter: () => ({ query: {} }),
}))

vi.mock("~/utils/trpc", () => ({
  trpc: {
    site: {
      getLocalisedSitemap: {
        useSuspenseQuery: () => [{ id: "root", children: [] }],
      },
      getConfig: {
        useSuspenseQuery: () => [{}],
      },
      getFooter: {
        useSuspenseQuery: () => [{ content: {} }],
      },
      getNavbar: {
        useSuspenseQuery: () => [{ content: {} }],
      },
    },
  },
}))

vi.mock("~/features/preview/hooks/useSiteThemeCssVars", () => ({
  useSiteThemeCssVars: () => ({}),
}))

// `PreviewWithCustomSitemap` pulls in `~/utils/generateAssetUrl`, which reads
// `~/env.mjs` at module-eval time. `env.mjs` accesses `process.env`, which
// isn't defined in Vitest's real-browser (Chromium) mode — unlike a real
// Next.js build, where these are statically inlined at compile time. Mocked
// here purely to avoid that test-environment gap, not because this test
// cares about asset URLs.
vi.mock("~/utils/generateAssetUrl", () => ({
  ASSETS_BASE_URL: "",
  generateAssetUrl: (url: string) => url,
}))

const PAGE: IsomerSchema = {
  page: { title: "About us", description: "About us" },
  layout: "content",
  content: [],
  version: "0.1.0",
}

const BEFORE_PAGE: IsomerSchema = {
  ...PAGE,
  content: [
    {
      type: "prose",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Old text" }] },
      ],
    },
  ],
}

const AFTER_PAGE: IsomerSchema = {
  ...PAGE,
  content: [
    {
      type: "prose",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "New text" }] },
      ],
    },
  ],
}

const renderModal = (isOpen: boolean) =>
  render(
    <ThemeProvider theme={theme}>
      <EditorDrawerProvider
        initialPageState={PAGE}
        type={ResourceType.Page}
        permalink="about-us"
        siteId={1}
        pageId={1}
        updatedAt={new Date()}
        title="About us"
      >
        <PageDiffModal
          isOpen={isOpen}
          onClose={noop}
          row={{
            id: "audit-log-1",
            createdAt: new Date("2026-01-01T00:00:00Z"),
            actor: { name: "Alice" },
            beforeContent: BEFORE_PAGE,
            afterContent: AFTER_PAGE,
          }}
        />
      </EditorDrawerProvider>
    </ThemeProvider>,
  )

// Note: queried by role "checkbox", not "switch" — the underlying
// `@opengovsg/design-system-react` `Switch` renders a native
// `<input type="checkbox">` (via Chakra's `useCheckbox`) with no way to
// override its ARIA role from the outside; any `role` prop passed to
// `<Switch>` lands on the wrapping `<label>` instead of the input itself.
// "checkbox" reflects its real accessible role.
describe("PageDiffModal", () => {
  it("does not render modal content when closed", () => {
    renderModal(false)
    expect(screen.queryByText("Alice")).toBeNull()
  })

  it("shows the change metadata and a highlight toggle when open", async () => {
    renderModal(true)

    await waitFor(() => {
      expect(screen.queryByText("Alice")).not.toBeNull()
    })
    expect(
      screen.queryByRole("checkbox", { name: "Highlight changes" }),
    ).not.toBeNull()
  })

  it("toggles highlight visibility on the rendered iframes", async () => {
    renderModal(true)

    await waitFor(() => {
      expect(document.querySelectorAll("iframe")).toHaveLength(2)
    })

    // Re-queried fresh each time rather than captured once: right after
    // mount, the iframe's `srcdoc` document may still be parsing, so
    // grabbing `contentDocument.body` too early can capture a reference
    // from before `<body>` exists (an async load-timing race, not a
    // per-render reload — the iframe/document/srcdoc are otherwise stable
    // across re-renders). Re-querying avoids relying on that timing.
    const getBodies = () =>
      Array.from(document.querySelectorAll("iframe")).map(
        (f) => (f as HTMLIFrameElement).contentDocument?.body,
      )

    const toggle = screen.getByRole("checkbox", { name: "Highlight changes" })
    // Default is on (per the approved design: highlights are on by default).
    expect(toggle).toBeChecked()
    // `setHighlightsVisible` toggles this class on each iframe's body —
    // check it directly rather than only the switch's own `checked`
    // property, so this test fails if the wiring to `setHighlightsVisible`
    // is ever broken or removed.
    await waitFor(() => {
      expect(
        getBodies().every((b) => !b?.classList.contains("isomer-diff-hidden")),
      ).toBe(true)
    })

    toggle.click()
    expect(toggle).not.toBeChecked()
    await waitFor(() => {
      expect(
        getBodies().every((b) => b?.classList.contains("isomer-diff-hidden")),
      ).toBe(true)
    })
  })
})
