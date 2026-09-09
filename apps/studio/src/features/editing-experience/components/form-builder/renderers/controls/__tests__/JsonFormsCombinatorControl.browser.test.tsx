import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core"
import { JsonForms } from "@jsonforms/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { TAG_CATEGORY_ITEM_FORMAT } from "@opengovsg/isomer-components"
import { Type } from "@sinclair/typebox"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { theme } from "~/theme"
import { ajv } from "~/utils/ajv"

import jsonFormsVerticalLayoutRenderer, {
  jsonFormsVerticalLayoutTester,
} from "../../layouts/JsonFormsVerticalLayout"
import {
  JsonFormsOneOfControl,
  jsonFormsOneOfControlTester,
} from "../JsonFormsCombinatorControl"
import JsonFormsConstControl, {
  jsonFormsConstControlTester,
} from "../JsonFormsConstControl"
import JsonFormsObjectControl, {
  jsonFormsObjectControlTester,
} from "../JsonFormsObjectControl"
import JsonFormsTextControl, {
  jsonFormsTextControlTester,
} from "../JsonFormsTextControl"

const renderers: JsonFormsRendererRegistryEntry[] = [
  { tester: jsonFormsOneOfControlTester, renderer: JsonFormsOneOfControl },
  { tester: jsonFormsObjectControlTester, renderer: JsonFormsObjectControl },
  { tester: jsonFormsTextControlTester, renderer: JsonFormsTextControl },
  { tester: jsonFormsConstControlTester, renderer: JsonFormsConstControl },
  {
    tester: jsonFormsVerticalLayoutTester,
    renderer: jsonFormsVerticalLayoutRenderer,
  },
]

const textBranch = Type.Object(
  { label: Type.String({ title: "Filter name" }) },
  { title: "Text filter" },
)
const dateBranch = Type.Object(
  {
    label: Type.String({ title: "Filter name" }),
    type: Type.Literal("date"),
  },
  { title: "Date filter" },
)

const unlockedSchema = Type.Unsafe({
  oneOf: [textBranch, dateBranch],
})
const lockedSchema = Type.Unsafe({
  oneOf: [textBranch, dateBranch],
  format: TAG_CATEGORY_ITEM_FORMAT,
})

const renderForm = (schema: typeof unlockedSchema, data: unknown) =>
  render(
    <ThemeProvider theme={theme}>
      <JsonForms schema={schema} data={data} renderers={renderers} ajv={ajv} />
    </ThemeProvider>,
  )

describe("JsonFormsCombinatorControl", () => {
  it("shows a Variant picker for a normal oneOf", () => {
    renderForm(unlockedSchema, { label: "Events" })

    expect(document.body.textContent).toContain("Variant")
    expect(document.body.textContent).toContain("Filter name")
  })

  it("skips the Variant picker when format is tag-category-item", () => {
    renderForm(lockedSchema, { label: "Events" })

    expect(document.body.textContent).not.toContain("Variant")
    expect(document.body.textContent).toContain("Filter name")
  })
})
