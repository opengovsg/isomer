import type { TSchema } from "@sinclair/typebox"
import { describe, expect, it } from "vitest"

import { getScopedSchema } from "../scopedSchema"

interface AllOfSubSchema extends TSchema {
  properties?: Record<string, TSchema>
  required?: string[]
}

const getSubSchemaPropertyKeys = (subSchema: AllOfSubSchema): string[] =>
  subSchema.properties === undefined ? [] : Object.keys(subSchema.properties)

describe("getScopedSchema", () => {
  describe("database layout", () => {
    it("should return schema for page.contentPageHeader", () => {
      const schema = getScopedSchema({
        layout: "database",
        scope: "page.contentPageHeader",
      })

      expect(schema).toBeDefined()
      expect(schema.type).toBe("object")
      expect(schema.properties).toBeDefined()
    })

    it("should return schema for page.database", () => {
      const schema = getScopedSchema({
        layout: "database",
        scope: "page.database",
      })

      expect(schema).toBeDefined()
      // Check for TypeBox schema structure (type property or allOf for Intersect schemas)
      expect(schema.type !== undefined || schema.allOf !== undefined).toBe(true)
      // For Intersect schemas, properties are in allOf array
      expect(
        schema.allOf !== undefined || schema.properties !== undefined,
      ).toBe(true)
    })

    it("should return schema for page", () => {
      const schema = getScopedSchema({
        layout: "database",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.type).toBe("object")
      expect(schema.properties).toBeDefined()
      expect(schema.properties.contentPageHeader).toBeDefined()
      expect(schema.properties.database).toBeDefined()
    })
  })

  describe("content layout", () => {
    it("should return schema for page", () => {
      const schema = getScopedSchema({
        layout: "content",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.type).toBe("object")
      expect(schema.properties).toBeDefined()
    })

    it("should return schema for page.contentPageHeader", () => {
      const schema = getScopedSchema({
        layout: "content",
        scope: "page.contentPageHeader",
      })

      expect(schema).toBeDefined()
      expect(schema.type).toBe("object")
      expect(schema.properties).toBeDefined()
    })
  })

  describe("article layout", () => {
    it("should return schema for page", () => {
      const schema = getScopedSchema({
        layout: "article",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.type).toBe("object")
      expect(schema.properties).toBeDefined()
    })
  })

  describe("homepage layout", () => {
    it("should return schema for page", () => {
      const schema = getScopedSchema({
        layout: "homepage",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.type).toBe("object")
      expect(schema.properties).toBeDefined()
    })
  })

  describe("index layout", () => {
    it("should return schema for page", () => {
      const schema = getScopedSchema({
        layout: "index",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.type).toBe("object")
      expect(schema.properties).toBeDefined()
    })
  })

  describe("collection layout", () => {
    it("should return schema for page", () => {
      const schema = getScopedSchema({
        layout: "collection",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema).toHaveProperty("type")
      // For Intersect schemas, properties are in allOf array
      expect(
        schema.allOf !== undefined || schema.properties !== undefined,
      ).toBe(true)
    })
  })

  describe("link layout", () => {
    it("should return schema for page", () => {
      const schema = getScopedSchema({
        layout: "link",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.type).toBe("object")
      expect(schema.properties).toBeDefined()
    })
  })

  describe("file layout", () => {
    it("should return schema for page", () => {
      const schema = getScopedSchema({
        layout: "file",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.type).toBe("object")
      expect(schema.properties).toBeDefined()
    })
  })

  describe("exclude functionality", () => {
    it("should exclude specified fields from database page schema", () => {
      const schema = getScopedSchema({
        exclude: ["contentPageHeader"],
        layout: "database",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.type).toBe("object")
      expect(schema.properties).toBeDefined()
      expect(schema.properties.contentPageHeader).toBeUndefined()
      expect(schema.properties.database).toBeDefined()
    })

    it("should exclude multiple fields from database page schema", () => {
      const schema = getScopedSchema({
        exclude: ["contentPageHeader", "database"],
        layout: "database",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.type).toBe("object")
      expect(schema.properties).toBeDefined()
      expect(schema.properties.contentPageHeader).toBeUndefined()
      expect(schema.properties.database).toBeUndefined()
    })

    it("should work with content layout and exclude fields", () => {
      const schema = getScopedSchema({
        exclude: ["contentPageHeader"],
        layout: "content",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.type).toBe("object")
      expect(schema.properties).toBeDefined()
      expect(schema.properties.contentPageHeader).toBeUndefined()
    })

    it("should work with nested scope and exclude fields", () => {
      const schema = getScopedSchema({
        exclude: ["title"],
        layout: "database",
        scope: "page.database",
      })

      expect(schema).toBeDefined()
      // For Intersect schemas, properties are in allOf array
      expect(
        schema.allOf !== undefined || schema.properties !== undefined,
      ).toBe(true)
    })

    it("should exclude fields from allOf sub-schemas in collection layout", () => {
      const schema = getScopedSchema({
        exclude: ["subtitle"],
        layout: "collection",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.allOf).toBeDefined()

      // "subtitle" should not appear in any allOf sub-schema
      for (const subSchema of schema.allOf) {
        if (subSchema.properties !== undefined) {
          expect(subSchema.properties.subtitle).toBeUndefined()
        }
      }
    })

    it("should exclude multiple fields across different allOf sub-schemas in collection layout", () => {
      const schema = getScopedSchema({
        exclude: ["subtitle", "variant", "image"],
        layout: "collection",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.allOf).toBeDefined()

      for (const subSchema of schema.allOf) {
        if (subSchema.properties !== undefined) {
          expect(subSchema.properties.subtitle).toBeUndefined()
          expect(subSchema.properties.variant).toBeUndefined()
          expect(subSchema.properties.image).toBeUndefined()
        }
      }
    })

    it("should preserve non-excluded fields in allOf sub-schemas", () => {
      const schema = getScopedSchema({
        exclude: ["subtitle"],
        layout: "collection",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.allOf).toBeDefined()

      // Other fields like "variant" should still exist
      const allProperties = schema.allOf.flatMap(getSubSchemaPropertyKeys)
      expect(allProperties).toContain("variant")
      expect(allProperties).not.toContain("subtitle")
    })

    it("should remove excluded fields from required array in allOf sub-schemas", () => {
      const schema = getScopedSchema({
        exclude: ["subtitle"],
        layout: "collection",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.allOf).toBeDefined()

      // "subtitle" should not appear in any required array
      for (const subSchema of schema.allOf) {
        if (Array.isArray(subSchema.required)) {
          expect(subSchema.required).not.toContain("subtitle")
        }
      }
    })

    it("should remove excluded fields from required array in non-allOf schemas", () => {
      const schema = getScopedSchema({
        exclude: ["contentPageHeader"],
        layout: "database",
        scope: "page",
      })

      expect(schema).toBeDefined()
      if (Array.isArray(schema.required)) {
        expect(schema.required).not.toContain("contentPageHeader")
      }
    })

    it("should return original schema when exclude is empty array", () => {
      const originalSchema = getScopedSchema({
        layout: "database",
        scope: "page",
      })

      const schemaWithEmptyExclude = getScopedSchema({
        exclude: [],
        layout: "database",
        scope: "page",
      })

      expect(schemaWithEmptyExclude).toEqual(originalSchema)
    })
  })

  describe("include functionality", () => {
    it("should keep only specified fields in collection layout (allOf)", () => {
      const schema = getScopedSchema({
        include: ["subtitle"],
        layout: "collection",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.allOf).toBeDefined()

      const allProperties = schema.allOf.flatMap(getSubSchemaPropertyKeys)
      expect(allProperties).toEqual(["subtitle"])
    })

    it("should keep multiple specified fields across allOf sub-schemas", () => {
      const schema = getScopedSchema({
        include: ["subtitle", "variant"],
        layout: "collection",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.allOf).toBeDefined()

      const allProperties = schema.allOf.flatMap(getSubSchemaPropertyKeys)
      expect(allProperties).toContain("subtitle")
      expect(allProperties).toContain("variant")
      expect(allProperties).not.toContain("sortOrder")
      expect(allProperties).not.toContain("image")
    })

    it("should keep only specified fields in flat (non-allOf) schemas", () => {
      const schema = getScopedSchema({
        include: ["database"],
        layout: "database",
        scope: "page",
      })

      expect(schema).toBeDefined()
      expect(schema.properties).toBeDefined()
      expect(schema.properties.database).toBeDefined()
      expect(schema.properties.contentPageHeader).toBeUndefined()
    })

    it("should filter required array to only included fields", () => {
      const schema = getScopedSchema({
        include: ["subtitle"],
        layout: "collection",
        scope: "page",
      })

      expect(schema).toBeDefined()
      for (const subSchema of schema.allOf) {
        if (Array.isArray(subSchema.required)) {
          for (const field of subSchema.required) {
            expect(field).toBe("subtitle")
          }
        }
      }
    })

    it("should throw when both include and exclude are provided", () => {
      expect(() =>
        getScopedSchema({
          exclude: ["variant"],
          include: ["subtitle"],
          layout: "collection",
          scope: "page",
        }),
      ).toThrow("mutually exclusive")
    })

    it("should return original schema when include is empty array", () => {
      const originalSchema = getScopedSchema({
        layout: "database",
        scope: "page",
      })

      const schemaWithEmptyInclude = getScopedSchema({
        include: [],
        layout: "database",
        scope: "page",
      })

      expect(schemaWithEmptyInclude).toEqual(originalSchema)
    })
  })
})
