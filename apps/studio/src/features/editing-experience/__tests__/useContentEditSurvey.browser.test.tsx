import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { PropsWithChildren } from "react"
import { act, render, renderHook } from "@testing-library/react"
import { createStore, Provider } from "jotai"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  EditorDrawerProvider,
  useEditorDrawerContext,
} from "~/contexts/EditorDrawerContext"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { hasContentEditAtom } from "../atoms"
import {
  LEFT_EDITOR_AFTER_EDITING_EVENT,
  PUBLISHED_AFTER_EDITING_EVENT,
} from "../constants"
import {
  useContentEditTracker,
  useFireContentEditSurveyEvent,
  useLeftEditorSurveyTracker,
} from "../hooks/useContentEditSurvey"

const trackEventMock = vi.hoisted(() => vi.fn())
vi.mock("@intercom/messenger-js-sdk", () => ({ trackEvent: trackEventMock }))

const mockEnv = vi.hoisted<{
  env: { NEXT_PUBLIC_INTERCOM_APP_ID: string | undefined }
}>(() => ({
  env: { NEXT_PUBLIC_INTERCOM_APP_ID: "test-app-id" },
}))
vi.mock("~/env.mjs", () => mockEnv)

const routeChangeStartHandlers = vi.hoisted<(() => void)[]>(() => [])
vi.mock("next/router", () => ({
  useRouter: () => ({
    events: {
      on: (_event: string, handler: () => void) => {
        routeChangeStartHandlers.push(handler)
      },
      off: (_event: string, handler: () => void) => {
        const index = routeChangeStartHandlers.indexOf(handler)
        if (index !== -1) routeChangeStartHandlers.splice(index, 1)
      },
    },
  }),
}))

const BASE_PAGE: IsomerSchema = {
  version: "0.1.0",
  layout: "homepage",
  page: {},
  content: [{ type: "prose", content: [] }],
}

const jotaiWrapper = (store: ReturnType<typeof createStore>) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  )
  return Wrapper
}

let drawerContext: ReturnType<typeof useEditorDrawerContext>

const TrackerHarness = () => {
  useContentEditTracker()
  drawerContext = useEditorDrawerContext()
  return null
}

const renderTracker = (store: ReturnType<typeof createStore>) =>
  render(
    <Provider store={store}>
      <EditorDrawerProvider
        initialPageState={BASE_PAGE}
        type={ResourceType.Page}
        permalink="/test-page"
        siteId={1}
        pageId={1}
        updatedAt={new Date()}
        title="Test page"
      >
        <TrackerHarness />
      </EditorDrawerProvider>
    </Provider>,
  )

beforeEach(() => {
  trackEventMock.mockClear()
  mockEnv.env.NEXT_PUBLIC_INTERCOM_APP_ID = "test-app-id"
  routeChangeStartHandlers.length = 0
})

describe("useFireContentEditSurveyEvent", () => {
  it("does nothing when no content edit has been made", () => {
    // Arrange
    const store = createStore()
    const { result } = renderHook(() => useFireContentEditSurveyEvent(), {
      wrapper: jotaiWrapper(store),
    })

    // Act
    act(() => result.current(PUBLISHED_AFTER_EDITING_EVENT))

    // Assert
    expect(trackEventMock).not.toHaveBeenCalled()
    expect(store.get(hasContentEditAtom)).toBe(false)
  })

  it("fires the event and resets the flag when a content edit has been made", () => {
    // Arrange
    const store = createStore()
    store.set(hasContentEditAtom, true)
    const { result } = renderHook(() => useFireContentEditSurveyEvent(), {
      wrapper: jotaiWrapper(store),
    })

    // Act
    act(() => result.current(PUBLISHED_AFTER_EDITING_EVENT))

    // Assert
    expect(trackEventMock).toHaveBeenCalledTimes(1)
    expect(trackEventMock).toHaveBeenCalledWith(PUBLISHED_AFTER_EDITING_EVENT)
    expect(store.get(hasContentEditAtom)).toBe(false)
  })

  it("is a no-op on a second call after the flag has been consumed", () => {
    // Arrange
    const store = createStore()
    store.set(hasContentEditAtom, true)
    const { result } = renderHook(() => useFireContentEditSurveyEvent(), {
      wrapper: jotaiWrapper(store),
    })
    act(() => result.current(PUBLISHED_AFTER_EDITING_EVENT))

    // Act
    act(() => result.current(PUBLISHED_AFTER_EDITING_EVENT))

    // Assert
    expect(trackEventMock).toHaveBeenCalledTimes(1)
  })

  it("resets the flag without firing when NEXT_PUBLIC_INTERCOM_APP_ID is unset", () => {
    // Arrange
    mockEnv.env.NEXT_PUBLIC_INTERCOM_APP_ID = undefined
    const store = createStore()
    store.set(hasContentEditAtom, true)
    const { result } = renderHook(() => useFireContentEditSurveyEvent(), {
      wrapper: jotaiWrapper(store),
    })

    // Act
    act(() => result.current(PUBLISHED_AFTER_EDITING_EVENT))

    // Assert
    expect(trackEventMock).not.toHaveBeenCalled()
    expect(store.get(hasContentEditAtom)).toBe(false)
  })
})

describe("useContentEditTracker", () => {
  it("sets the flag when content diverges", () => {
    // Arrange
    const store = createStore()
    renderTracker(store)

    // Act
    // setPreviewPageState uses flushSync internally, so state changes must be
    // wrapped in act() to flush the resulting effects deterministically
    act(() =>
      drawerContext.setPreviewPageState((previous) => ({
        ...previous,
        content: [...previous.content, { type: "prose", content: [] }],
      })),
    )

    // Assert
    expect(store.get(hasContentEditAtom)).toBe(true)
  })

  it("does not set the flag on a re-render with deep-equal content", () => {
    // Arrange
    const store = createStore()
    renderTracker(store)

    // Act
    act(() =>
      drawerContext.setPreviewPageState((previous) => ({
        ...previous,
        content: [...previous.content],
      })),
    )

    // Assert
    expect(store.get(hasContentEditAtom)).toBe(false)
  })

  it("does not set the flag when content diverges in raw JSON mode", () => {
    // Arrange
    const store = createStore()
    renderTracker(store)
    act(() => drawerContext.setDrawerState({ state: "rawJsonEditor" }))

    // Act
    act(() =>
      drawerContext.setPreviewPageState((previous) => ({
        ...previous,
        content: [...previous.content, { type: "prose", content: [] }],
      })),
    )

    // Assert
    expect(store.get(hasContentEditAtom)).toBe(false)

    // Act: leaving raw JSON mode must not retroactively arm the flag
    // (docs/adr/0003-editing-survey-measuring-points.md) — pins that the
    // baseline ref is advanced before the rawJsonEditor guard
    act(() => drawerContext.setDrawerState({ state: "root" }))

    // Assert
    expect(store.get(hasContentEditAtom)).toBe(false)
  })

  it("re-arms after the flag is consumed, emitting one event per burst", () => {
    // Arrange
    const store = createStore()
    renderTracker(store)
    const { result } = renderHook(() => useFireContentEditSurveyEvent(), {
      wrapper: jotaiWrapper(store),
    })

    // Act: first burst — diverge content, then fire
    act(() =>
      drawerContext.setPreviewPageState((previous) => ({
        ...previous,
        content: [...previous.content, { type: "prose", content: [] }],
      })),
    )
    act(() => result.current(PUBLISHED_AFTER_EDITING_EVENT))

    // Assert
    expect(trackEventMock).toHaveBeenCalledTimes(1)
    expect(store.get(hasContentEditAtom)).toBe(false)

    // Act: second burst — a fresh divergence
    act(() =>
      drawerContext.setPreviewPageState((previous) => ({
        ...previous,
        content: [...previous.content, { type: "prose", content: [] }],
      })),
    )

    // Assert: the consumed flag is re-armed
    expect(store.get(hasContentEditAtom)).toBe(true)

    // Act: fire the second burst
    act(() => result.current(PUBLISHED_AFTER_EDITING_EVENT))

    // Assert
    expect(trackEventMock).toHaveBeenCalledTimes(2)
  })
})

describe("useLeftEditorSurveyTracker", () => {
  it("fires the left-editor event on route change when a content edit has been made", () => {
    // Arrange
    const store = createStore()
    store.set(hasContentEditAtom, true)
    renderHook(() => useLeftEditorSurveyTracker(), {
      wrapper: jotaiWrapper(store),
    })

    // Act
    act(() => routeChangeStartHandlers.forEach((handler) => handler()))

    // Assert
    expect(trackEventMock).toHaveBeenCalledTimes(1)
    expect(trackEventMock).toHaveBeenCalledWith(LEFT_EDITOR_AFTER_EDITING_EVENT)
    expect(store.get(hasContentEditAtom)).toBe(false)
  })

  it("unsubscribes from route changes on unmount", () => {
    // Arrange
    const store = createStore()
    const { unmount } = renderHook(() => useLeftEditorSurveyTracker(), {
      wrapper: jotaiWrapper(store),
    })

    // Act
    unmount()

    // Assert
    expect(routeChangeStartHandlers).toHaveLength(0)
  })
})
