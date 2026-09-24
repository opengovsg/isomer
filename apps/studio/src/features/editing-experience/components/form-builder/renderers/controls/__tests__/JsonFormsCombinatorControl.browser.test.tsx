import type {
  JsonFormsRendererRegistryEntry,
  JsonSchema,
} from "@jsonforms/core"
import { JsonForms } from "@jsonforms/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import {
  TAG_CATEGORY_ITEM_FORMAT,
  TAG_CATEGORY_TYPE,
} from "@opengovsg/isomer-components"
import { Type } from "@sinclair/typebox"
import { fireEvent, render, screen } from "@testing-library/react"
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

// Distinct extra fields so we can tell which oneOf branch is mounted.
const textBranchWithOptions = Type.Object(
  {
    label: Type.String({ title: "Filter name" }),
    type: Type.Optional(Type.Literal(TAG_CATEGORY_TYPE.Text)),
    options: Type.String({ title: "Text filter options" }),
  },
  { title: "Text filter" },
)
const dateBranchWithStatusLabels = Type.Object(
  {
    label: Type.String({ title: "Filter name" }),
    type: Type.Literal(TAG_CATEGORY_TYPE.Date),
    statusLabels: Type.String({ title: "Date filter custom labels" }),
  },
  { title: "Date filter" },
)
const lockedDiscriminatedSchema = Type.Unsafe({
  oneOf: [textBranchWithOptions, dateBranchWithStatusLabels],
  format: TAG_CATEGORY_ITEM_FORMAT,
})

const renderForm = (schema: JsonSchema, data: unknown) =>
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

  it("keeps a date filter on the date branch when filter name is cleared", () => {
    // Arrange
    renderForm(lockedDiscriminatedSchema, {
      label: "Events",
      type: TAG_CATEGORY_TYPE.Date,
      statusLabels: "Event ended",
    })
    expect(document.body.textContent).toContain("Date filter custom labels")
    expect(document.body.textContent).not.toContain("Text filter options")

    // Act
    fireEvent.change(screen.getByPlaceholderText("Filter name"), {
      target: { value: "" },
    })

    // Assert
    expect(document.body.textContent).toContain("Date filter custom labels")
    expect(document.body.textContent).not.toContain("Text filter options")
  })
})
