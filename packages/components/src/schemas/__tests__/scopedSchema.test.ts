import { describe, expect, it } from "vitest"

import { getScopedSchema } from "../scopedSchema"

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
      expect(schema.type || schema.allOf).toBeDefined()
      // For Intersect schemas, properties are in allOf array
      expect(schema.allOf || schema.properties).toBeDefined()
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
      expect(schema.allOf || schema.properties).toBeDefined()
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
        layout: "database",
        scope: "page",
        exclude: ["contentPageHeader"],
      })

      expect(schema).toBeDefined()
      expect(schema.type).toBe("object")
      expect(schema.properties).toBeDefined()
      expect(schema.properties.contentPageHeader).toBeUndefined()
      expect(schema.properties.database).toBeDefined()
    })

    it("should exclude multiple fields from database page schema", () => {
      const schema = getScopedSchema({
        layout: "database",
        scope: "page",
        exclude: ["contentPageHeader", "database"],
      })

      expect(schema).toBeDefined()
      expect(schema.type).toBe("object")
      expect(schema.properties).toBeDefined()
      expect(schema.properties.contentPageHeader).toBeUndefined()
      expect(schema.properties.database).toBeUndefined()
    })

    it("should work with content layout and exclude fields", () => {
      const schema = getScopedSchema({
        layout: "content",
        scope: "page",
        exclude: ["contentPageHeader"],
      })

      expect(schema).toBeDefined()
      expect(schema.type).toBe("object")
      expect(schema.properties).toBeDefined()
      expect(schema.properties.contentPageHeader).toBeUndefined()
    })

    it("should work with nested scope and exclude fields", () => {
      const schema = getScopedSchema({
        layout: "database",
        scope: "page.database",
        exclude: ["title"],
      })

      expect(schema).toBeDefined()
      // For Intersect schemas, properties are in allOf array
      expect(schema.allOf || schema.properties).toBeDefined()
    })

    it("should return original schema when exclude is empty array", () => {
      const originalSchema = getScopedSchema({
        layout: "database",
        scope: "page",
      })

      const schemaWithEmptyExclude = getScopedSchema({
        layout: "database",
        scope: "page",
        exclude: [],
      })

      expect(schemaWithEmptyExclude).toEqual(originalSchema)
    })
  })
})
