import type { SelectInstance } from "chakra-react-select"
import { cleanup, render } from "@testing-library/react"
import { Window } from "happy-dom"
import React from "react"
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type { BaseSelectOption } from "./BaseSelect"

const { mockSelectInstance } = vi.hoisted(() => ({
  mockSelectInstance: { focus: vi.fn() },
}))

vi.mock("chakra-react-select", async () => {
  const React = await import("react")

  return {
    Select: React.forwardRef<unknown, Record<string, unknown>>(
      (_props, ref) => {
        React.useImperativeHandle(ref, () => mockSelectInstance)
        return React.createElement("div", { "data-testid": "base-select" })
      },
    ),
  }
})

const { BaseSelect } = await import("./BaseSelect")

let happyDomWindow: Window

beforeAll(() => {
  happyDomWindow = new Window()
  const global = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT: boolean
  }
  global.IS_REACT_ACT_ENVIRONMENT = true
  vi.stubGlobal("window", happyDomWindow)
  vi.stubGlobal("document", happyDomWindow.document)
  vi.stubGlobal("HTMLElement", happyDomWindow.HTMLElement)
})

afterEach(() => {
  cleanup()
})

afterAll(() => {
  happyDomWindow.close()
  vi.unstubAllGlobals()
})

describe("BaseSelect", () => {
  it("forwards refs to the inner select component", () => {
    const ref = React.createRef<SelectInstance<BaseSelectOption<string>>>()

    render(
      <BaseSelect
        ref={ref}
        options={[{ label: "9:00 AM", value: "09:00" }]}
        value="09:00"
        onChange={vi.fn()}
      />,
    )

    expect(ref.current).toBe(mockSelectInstance)
  })
})
