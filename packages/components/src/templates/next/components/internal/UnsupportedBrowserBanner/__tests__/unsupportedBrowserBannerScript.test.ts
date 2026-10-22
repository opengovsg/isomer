import { parse } from "acorn"
import { describe, expect, it } from "vitest"

import {
  DISMISSED_STORAGE_KEY,
  UNSUPPORTED_BROWSER_BANNER_ID,
  UNSUPPORTED_BROWSER_BANNER_SCRIPT,
} from "../unsupportedBrowserBannerScript"

const CHROME_39_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36"
const CHROME_64_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36"

// Minimal stand-ins for the DOM APIs the script touches
const runScript = ({
  userAgent,
  storage = {},
}: {
  userAgent: string
  storage?: Record<string, string>
}) => {
  const button: { onclick: (() => void) | null } = { onclick: null }
  const banner = {
    hidden: true,
    getElementsByTagName: (tagName: string) =>
      tagName === "button" ? [button] : [],
  }

  // Evaluating the inline script is what's under test
  // oxlint-disable-next-line @typescript-eslint/no-implied-eval
  const script = new Function(
    "navigator",
    "document",
    "sessionStorage",
    UNSUPPORTED_BROWSER_BANNER_SCRIPT,
  ) as (navigator: unknown, document: unknown, sessionStorage: unknown) => void
  script(
    { userAgent },
    {
      getElementById: (id: string) =>
        id === UNSUPPORTED_BROWSER_BANNER_ID ? banner : null,
    },
    {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value
      },
    },
  )

  return { banner, button, storage }
}

describe("UNSUPPORTED_BROWSER_BANNER_SCRIPT", () => {
  it("should parse as ES5 so browsers that cannot run the bundle still run it", () => {
    expect(() =>
      parse(UNSUPPORTED_BROWSER_BANNER_SCRIPT, { ecmaVersion: 5 }),
    ).not.toThrow()
  })

  it("should show the banner for Chrome 39", () => {
    const { banner } = runScript({ userAgent: CHROME_39_USER_AGENT })

    expect(banner.hidden).toBe(false)
  })

  it("should keep the banner hidden for Chrome 64", () => {
    const { banner } = runScript({ userAgent: CHROME_64_USER_AGENT })

    expect(banner.hidden).toBe(true)
  })

  it("should keep the banner hidden for an empty user agent", () => {
    const { banner } = runScript({ userAgent: "" })

    expect(banner.hidden).toBe(true)
  })

  it("should keep the banner hidden once dismissed this session", () => {
    const { banner } = runScript({
      userAgent: CHROME_39_USER_AGENT,
      storage: { [DISMISSED_STORAGE_KEY]: "true" },
    })

    expect(banner.hidden).toBe(true)
  })

  it("should hide the banner and remember the dismissal on close", () => {
    const { banner, button, storage } = runScript({
      userAgent: CHROME_39_USER_AGENT,
    })

    button.onclick?.()

    expect(banner.hidden).toBe(true)
    expect(storage[DISMISSED_STORAGE_KEY]).toBe("true")
  })
})
