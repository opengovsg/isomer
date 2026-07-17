import type { ControlElement, JsonSchema, TesterContext } from "@jsonforms/core"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { jsonFormsArrayControlTester } from "../JsonFormsArrayControl"
import { jsonFormsAnyOfControlTester } from "../JsonFormsCombinatorControl"

const NOT_APPLICABLE = -1

const control = (scope: string): ControlElement => ({ type: "Control", scope })

const testerContext = (rootSchema: JsonSchema): TesterContext => ({
  rootSchema,
  config: {},
})

describe("jsonFormsArrayControlTester", () => {
  it("should match the canvas blocks array (items are a union of components)", () => {
    const canvasSchema = getComponentSchema({
      component: "canvas",
    }) as JsonSchema

    const rank = jsonFormsArrayControlTester(
      control("#/properties/blocks"),
      canvasSchema,
      testerContext(canvasSchema),
    )

    expect(rank).toBe(JSON_FORMS_RANKING.ArrayControl)
  })

  it("should still match plain object arrays", () => {
    const schema: JsonSchema = {
      type: "object",
      properties: {
        cards: {
          type: "array",
          items: {
            type: "object",
            properties: { title: { type: "string" } },
          },
        },
      },
    }

    const rank = jsonFormsArrayControlTester(
      control("#/properties/cards"),
      schema,
      testerContext(schema),
    )

    expect(rank).toBe(JSON_FORMS_RANKING.ArrayControl)
  })

  it("should not match arrays whose union members are $refs, such as prose content", () => {
    // Mirrors the prose content schema, which must keep falling through to the
    // dedicated prose (Tiptap) control instead of the generic array control
    const schema: JsonSchema = {
      type: "object",
      properties: {
        content: {
          type: "array",
          items: {
            anyOf: [
              { $ref: "#/components/native/divider" },
              { $ref: "#/components/native/paragraph" },
            ],
          },
        },
      },
    }

    const rank = jsonFormsArrayControlTester(
      control("#/properties/content"),
      schema,
      testerContext(schema),
    )

    expect(rank).toBe(NOT_APPLICABLE)
  })

  it("should dispatch canvas block items to the anyOf combinator control", () => {
    const canvasSchema = getComponentSchema({
      component: "canvas",
    }) as JsonSchema
    const itemsSchema = canvasSchema.properties?.blocks?.items as
      | JsonSchema
      | undefined

    expect(itemsSchema?.anyOf).toBeDefined()

    // The nested drawer dispatches each block with a Control of scope "#",
    // which must resolve to the variant picker for the component union
    const rank = jsonFormsAnyOfControlTester(
      control("#"),
      itemsSchema!,
      testerContext(canvasSchema),
    )

    expect(rank).toBe(JSON_FORMS_RANKING.AnyOfControl)
  })
})
