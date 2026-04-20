import { describe, expect, it } from "vitest"

import {
  DUPLICATE_OPTION_LABEL_MESSAGE,
  postProcessFormBuilderCoreErrors,
} from "../formBuilderJsonFormsCore"

describe("postProcessFormBuilderCoreErrors", () => {
  it("adds per-label errors and strips array-level uniqueItemPropertiesIgnoreCase on /options", () => {
    const errors = [
      {
        instancePath: "/tagCategories/0/options",
        schemaPath:
          "#/properties/tagCategories/items/properties/options/uniqueItemPropertiesIgnoreCase",
        keyword: "uniqueItemPropertiesIgnoreCase",
        message:
          'must pass "uniqueItemPropertiesIgnoreCase" keyword validation',
        params: {},
      },
    ]
    const data = {
      tagCategories: [
        {
          options: [
            { label: "x", id: "1" },
            { label: "X", id: "2" },
          ],
        },
      ],
    }
    const out = postProcessFormBuilderCoreErrors(errors, data)
    expect(
      out.some((e) => e.keyword === "uniqueItemPropertiesIgnoreCase"),
    ).toBe(false)
    expect(out.filter((e) => e.keyword === "duplicateOptionLabel")).toHaveLength(
      2,
    )
    expect(
      out.every(
        (e) =>
          e.keyword === "duplicateOptionLabel" &&
          e.message === DUPLICATE_OPTION_LABEL_MESSAGE,
      ),
    ).toBe(true)
    expect(out.map((e) => e.instancePath).sort()).toEqual([
      "/tagCategories/0/options/0/label",
      "/tagCategories/0/options/1/label",
    ])
  })

  it("unwraps ajv-errors errorMessage wrapper", () => {
    const errors = [
      {
        instancePath: "/tagCategories/0/options",
        schemaPath: "#/properties/tagCategories/items/properties/options/errorMessage",
        keyword: "errorMessage",
        message: "dup",
        params: {
          errors: [
            {
              instancePath: "/tagCategories/0/options",
              schemaPath:
                "#/properties/tagCategories/items/properties/options/uniqueItemPropertiesIgnoreCase",
              keyword: "uniqueItemPropertiesIgnoreCase",
              message:
                'must pass "uniqueItemPropertiesIgnoreCase" keyword validation',
              params: {},
              emUsed: true,
            },
          ],
        },
      },
    ]
    const data = {
      tagCategories: [
        {
          options: [
            { label: "a", id: "1" },
            { label: "A", id: "2" },
          ],
        },
      ],
    }
    const out = postProcessFormBuilderCoreErrors(errors, data)
    expect(out.some((e) => e.keyword === "errorMessage")).toBe(false)
    expect(out.filter((e) => e.keyword === "duplicateOptionLabel")).toHaveLength(
      2,
    )
  })
})
