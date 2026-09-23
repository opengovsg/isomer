import { cleanup, render } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { shutdownIntercom, trackEvent } from "~/lib/intercom"

import { Intercom } from "./Intercom"

const sdk = vi.hoisted(() => ({
  Intercom: vi.fn(),
  boot: vi.fn(),
  shutdown: vi.fn(),
  update: vi.fn(),
  trackEvent: vi.fn(),
}))
vi.mock("@intercom/messenger-js-sdk", () => sdk)

const router = vi.hoisted(() => ({ asPath: "/" }))
vi.mock("next/router", () => ({ useRouter: () => router }))

const mockEnv = vi.hoisted<{
  env: {
    NEXT_PUBLIC_APP_ENV: string
    NEXT_PUBLIC_INTERCOM_APP_ID: string | undefined
  }
}>(() => ({
  env: {
    NEXT_PUBLIC_APP_ENV: "staging",
    NEXT_PUBLIC_INTERCOM_APP_ID: "test-app-id",
  },
}))
vi.mock("~/env.mjs", () => mockEnv)

const session = vi.hoisted(() => ({
  loggedIn: true,
  user: {
    id: "author",
    email: "author@example.com",
    name: "Tour author",
    createdAt: new Date("2026-01-01"),
  },
}))
vi.mock("~/features/auth", () => ({
  useLoginState: () => ({ hasLoginStateFlag: session.loggedIn }),
}))
vi.mock("~/features/me/api", () => ({
  useMe: () => ({ me: session.user }),
}))

beforeEach(() => {
  shutdownIntercom()
  vi.clearAllMocks()
  router.asPath = "/"
  mockEnv.env.NEXT_PUBLIC_APP_ENV = "staging"
  mockEnv.env.NEXT_PUBLIC_INTERCOM_APP_ID = "test-app-id"
  session.loggedIn = true
  session.user = { ...session.user, id: "author" }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it("only runs while logged in, and can restart after logout", () => {
  session.loggedIn = false
  const { rerender, unmount } = render(<Intercom />)

  trackEvent("logged out")
  expect(sdk.Intercom).not.toHaveBeenCalled()
  expect(sdk.boot).not.toHaveBeenCalled()
  expect(sdk.trackEvent).not.toHaveBeenCalled()

  session.loggedIn = true
  rerender(<Intercom />)
  expect([...sdk.Intercom.mock.calls, ...sdk.boot.mock.calls]).toHaveLength(1)
  trackEvent("logged in")
  expect(sdk.trackEvent).toHaveBeenCalledWith("logged in")

  // Ordinary app renders must not tear down a tour during navigation.
  rerender(<Intercom />)
  expect(sdk.shutdown).not.toHaveBeenCalled()

  // User data refreshes update the current session; an identity change resets it.
  session.user = { ...session.user, name: "Updated name" }
  rerender(<Intercom />)
  expect(sdk.update).toHaveBeenLastCalledWith(
    expect.objectContaining({ name: "Updated name" }),
  )
  expect(sdk.shutdown).not.toHaveBeenCalled()
  session.user = { ...session.user, id: "another-author" }
  rerender(<Intercom />)
  expect(sdk.shutdown).toHaveBeenCalledTimes(1)
  expect(sdk.boot).toHaveBeenLastCalledWith(
    expect.objectContaining({ user_id: "another-author" }),
  )

  session.loggedIn = false
  rerender(<Intercom />)
  expect(sdk.shutdown).toHaveBeenCalledTimes(2)
  trackEvent("logged out")
  expect(sdk.trackEvent).toHaveBeenCalledTimes(1)

  session.loggedIn = true
  rerender(<Intercom />)
  expect(sdk.boot).toHaveBeenLastCalledWith(
    expect.objectContaining({
      app_id: "test-app-id",
      user_id: "another-author",
    }),
  )
  trackEvent("logged back in")
  expect(sdk.trackEvent).toHaveBeenCalledTimes(2)
  unmount()
  expect(sdk.shutdown).toHaveBeenCalledTimes(3)
})

it("updates Intercom on URL changes without restarting the session", () => {
  const now = vi.spyOn(Date, "now").mockReturnValue(1_800_000_000_000)
  const { rerender } = render(<Intercom />)

  for (const url of [
    "/sites/1",
    "/sites/1?tab=pages",
    "/sites/1?tab=pages#content",
  ]) {
    now.mockReturnValue(Date.now() + 1000)
    router.asPath = url
    rerender(<Intercom />)
    expect(sdk.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        user_id: "author",
        last_request_at: Math.floor(Date.now() / 1000),
      }),
    )
  }
  expect(sdk.update).toHaveBeenCalledTimes(3)
  expect([...sdk.Intercom.mock.calls, ...sdk.boot.mock.calls]).toHaveLength(1)
  expect(sdk.shutdown).not.toHaveBeenCalled()

  // Rendering the same URL must not consume another Intercom update.
  rerender(<Intercom />)
  expect(sdk.update).toHaveBeenCalledTimes(3)

  session.loggedIn = false
  router.asPath = "/sites/2"
  rerender(<Intercom />)
  expect(sdk.update).toHaveBeenCalledTimes(3)
  expect([...sdk.Intercom.mock.calls, ...sdk.boot.mock.calls]).toHaveLength(1)
  expect(sdk.shutdown).toHaveBeenCalledTimes(1)
})

it.each(["staging", "production", "uat"])(
  "starts Intercom in %s without feature flags",
  (appEnv) => {
    mockEnv.env.NEXT_PUBLIC_APP_ENV = appEnv
    render(<Intercom />)
    expect([...sdk.Intercom.mock.calls, ...sdk.boot.mock.calls]).toHaveLength(1)
    trackEvent("existing event")
    expect(sdk.trackEvent).toHaveBeenCalledWith("existing event")
  },
)

it("does not initialize without an app ID", () => {
  mockEnv.env.NEXT_PUBLIC_INTERCOM_APP_ID = undefined
  render(<Intercom />)
  expect(sdk.Intercom).not.toHaveBeenCalled()
  expect(sdk.boot).not.toHaveBeenCalled()
})
