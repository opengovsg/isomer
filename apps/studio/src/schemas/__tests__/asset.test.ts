import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"
import { FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING } from "~/features/editing-experience/components/form-builder/renderers/controls/constants"

import {
  deleteAssetsSchema,
  getPresignedPutUrlSchema,
  MAX_DELETE_FILE_KEYS,
} from "../asset"

describe("getPresignedPutUrlSchema", () => {
  const validBaseData = {
    siteId: 1,
    resourceId: "test-resource-id",
  }

  describe("fileName validation", () => {
    describe("file extension validation", () => {
      // Test all allowed image extensions
      Object.keys(IMAGE_ACCEPTED_MIME_TYPE_MAPPING).forEach((extension) => {
        it(`should accept valid image extension: ${extension}`, () => {
          const fileName = `test-image${extension}`
          const result = getPresignedPutUrlSchema.safeParse({
            ...validBaseData,
            fileName,
          })
          expect(result.success).toBe(true)
        })
      })

      // Test all allowed file extensions
      Object.keys(FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING).forEach(
        (extension) => {
          it(`should accept valid file extension: ${extension}`, () => {
            const fileName = `test-file${extension}`
            const result = getPresignedPutUrlSchema.safeParse({
              ...validBaseData,
              fileName,
            })
            expect(result.success).toBe(true)
          })
        },
      )

      // Test case insensitivity
      it("should accept extensions with different cases", () => {
        const testCases = ["test.PNG", "test.JPEG", "test.PDF", "test.XLSX"]

        testCases.forEach((fileName) => {
          const result = getPresignedPutUrlSchema.safeParse({
            ...validBaseData,
            fileName,
          })
          expect(result.success).toBe(true)
        })
      })

      // Test files with multiple dots
      it("should extract extension from files with multiple dots", () => {
        const testCases = [
          "my.file.name.png",
          "document.final.pdf",
          "data.backup.xlsx",
        ]

        testCases.forEach((fileName) => {
          const result = getPresignedPutUrlSchema.safeParse({
            ...validBaseData,
            fileName,
          })
          expect(result.success).toBe(true)
        })
      })

      // Test invalid extensions
      it("should reject invalid file extensions", () => {
        const invalidExtensions = [
          "test.exe",
          "test.bat",
          "test.sh",
          "test.js",
          "test.html",
          "test.php",
          "test.py",
          "test.zip",
          "test.rar",
          "test.html",
        ]

        invalidExtensions.forEach((fileName) => {
          const result = getPresignedPutUrlSchema.safeParse({
            ...validBaseData,
            fileName,
          })
          expect(result.success).toBe(false)
          if (!result.success) {
            expect(result.error.issues[0]?.message).toBe(
              "File type not allowed. Please upload a supported file type.",
            )
          }
        })
      })

      // Test files without extensions
      it("should reject files without extensions", () => {
        const filesWithoutExtensions = [
          "testfile",
          "my-document",
          "image",
          "file",
        ]

        filesWithoutExtensions.forEach((fileName) => {
          const result = getPresignedPutUrlSchema.safeParse({
            ...validBaseData,
            fileName,
          })
          expect(result.success).toBe(false)
          if (!result.success) {
            expect(result.error.issues[0]?.message).toBe(
              "File type not allowed. Please upload a supported file type.",
            )
          }
        })
      })

      // Test files with only dots
      it("should reject files with only dots", () => {
        const invalidFiles = [".", "..", "...", "file.", ".file"]

        invalidFiles.forEach((fileName) => {
          const result = getPresignedPutUrlSchema.safeParse({
            ...validBaseData,
            fileName,
          })
          expect(result.success).toBe(false)
        })
      })
    })

    describe("file name starting character validation", () => {
      it("should accept file names starting with letters", () => {
        const validNames = [
          "test.png",
          "image.jpeg",
          "document.pdf",
          "MyFile.xlsx",
        ]

        validNames.forEach((fileName) => {
          const result = getPresignedPutUrlSchema.safeParse({
            ...validBaseData,
            fileName,
          })
          expect(result.success).toBe(true)
        })
      })

      it("should accept file names starting with numbers", () => {
        const validNames = ["1test.png", "123image.jpeg", "0document.pdf"]

        validNames.forEach((fileName) => {
          const result = getPresignedPutUrlSchema.safeParse({
            ...validBaseData,
            fileName,
          })
          expect(result.success).toBe(true)
        })
      })

      it("should accept file names starting with hyphens", () => {
        const validNames = ["-test.png", "-image.jpeg", "-document.pdf"]

        validNames.forEach((fileName) => {
          const result = getPresignedPutUrlSchema.safeParse({
            ...validBaseData,
            fileName,
          })
          expect(result.success).toBe(true)
        })
      })

      it("should accept file names starting with underscores", () => {
        const validNames = ["_test.png", "_image.jpeg", "_document.pdf"]

        validNames.forEach((fileName) => {
          const result = getPresignedPutUrlSchema.safeParse({
            ...validBaseData,
            fileName,
          })
          expect(result.success).toBe(true)
        })
      })

      it("should reject file names starting with invalid characters", () => {
        const invalidNames = [
          " test.png",
          "@test.png",
          "#test.png",
          "$test.png",
          "%test.png",
          "&test.png",
          "*test.png",
          "(test.png",
          ")test.png",
          "+test.png",
          "=test.png",
          "[test.png",
          "]test.png",
          "{test.png",
          "}test.png",
          "|test.png",
          "\\test.png",
          "/test.png",
          "?test.png",
          "!test.png",
          "~test.png",
          "`test.png",
          "'test.png",
          '"test.png',
          ";test.png",
          ":test.png",
          "<test.png",
          ">test.png",
          ",test.png",
        ]

        invalidNames.forEach((fileName) => {
          const result = getPresignedPutUrlSchema.safeParse({
            ...validBaseData,
            fileName,
          })
          expect(result.success).toBe(false)
          if (!result.success) {
            expect(result.error.issues[0]?.message).toBe(
              "File name must start with a letter, number, hyphen, or underscore",
            )
          }
        })
      })
    })

    describe("required field validation", () => {
      it("should reject when fileName is missing", () => {
        const result = getPresignedPutUrlSchema.safeParse({
          ...validBaseData,
          // fileName is missing
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe("Missing file name")
        }
      })

      it("should reject when fileName is empty string", () => {
        const result = getPresignedPutUrlSchema.safeParse({
          ...validBaseData,
          fileName: "",
        })
        expect(result.success).toBe(false)
      })
    })
  })
})

describe("deleteAssetsSchema", () => {
  const validBaseData = {
    siteId: 1,
    resourceId: "test-resource-id",
  }

  const makeFileKeys = (count: number) =>
    Array.from({ length: count }, (_, i) => `1/uuid-${i}/file-${i}.png`)

  it(`should accept exactly ${MAX_DELETE_FILE_KEYS} file keys`, () => {
    const result = deleteAssetsSchema.safeParse({
      ...validBaseData,
      fileKeys: makeFileKeys(MAX_DELETE_FILE_KEYS),
    })
    expect(result.success).toBe(true)
  })

  it("should accept an empty file keys array", () => {
    const result = deleteAssetsSchema.safeParse({
      ...validBaseData,
      fileKeys: [],
    })
    expect(result.success).toBe(true)
  })

  it(`should reject more than ${MAX_DELETE_FILE_KEYS} file keys`, () => {
    const result = deleteAssetsSchema.safeParse({
      ...validBaseData,
      fileKeys: makeFileKeys(MAX_DELETE_FILE_KEYS + 1),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        `You can only delete up to ${MAX_DELETE_FILE_KEYS} assets at a time`,
      )
    }
  })
})
