import { describe, expect, it } from "vitest"

import { formatBytes } from "../formatBytes"

describe("formatBytes", () => {
  describe("edge cases", () => {
    it("should return '0 B' for zero bytes", () => {
      expect(formatBytes(0)).toBe("0 B")
    })

    it("should return '0 B' for negative bytes", () => {
      expect(formatBytes(-1)).toBe("0 B")
      expect(formatBytes(-100)).toBe("0 B")
    })
  })

  describe("bytes (B)", () => {
    it("should format bytes correctly", () => {
      expect(formatBytes(1)).toBe("1.00 B")
      expect(formatBytes(100)).toBe("100.00 B")
      expect(formatBytes(1023)).toBe("1023.00 B")
    })
  })

  describe("kilobytes (KB)", () => {
    it("should format kilobytes correctly", () => {
      expect(formatBytes(1024)).toBe("1.00 KB")
      expect(formatBytes(1536)).toBe("1.50 KB")
      expect(formatBytes(2048)).toBe("2.00 KB")
      expect(formatBytes(1048575)).toBe("1024.00 KB")
    })
  })

  describe("megabytes (MB)", () => {
    it("should format megabytes correctly", () => {
      expect(formatBytes(1048576)).toBe("1.00 MB")
      expect(formatBytes(1572864)).toBe("1.50 MB")
      expect(formatBytes(2097152)).toBe("2.00 MB")
      expect(formatBytes(1073741823)).toBe("1024.00 MB")
    })
  })

  describe("gigabytes (GB)", () => {
    it("should format gigabytes correctly", () => {
      expect(formatBytes(1073741824)).toBe("1.00 GB")
      expect(formatBytes(1610612736)).toBe("1.50 GB")
      expect(formatBytes(2147483648)).toBe("2.00 GB")
      expect(formatBytes(1099511627775)).toBe("1024.00 GB")
    })
  })

  describe("terabytes (TB)", () => {
    it("should format terabytes correctly", () => {
      expect(formatBytes(1099511627776)).toBe("1.00 TB")
      expect(formatBytes(1649267441664)).toBe("1.50 TB")
      expect(formatBytes(2199023255552)).toBe("2.00 TB")
    })

    it("should handle very large values", () => {
      expect(formatBytes(1125899906842624)).toBe("1024.00 TB")
      expect(formatBytes(1152921504606846976)).toBe("1048576.00 TB")
    })
  })

  describe("decimal precision", () => {
    it("should maintain 2 decimal places", () => {
      expect(formatBytes(1025)).toBe("1.00 KB")
      expect(formatBytes(1536)).toBe("1.50 KB")
      expect(formatBytes(1792)).toBe("1.75 KB")
      expect(formatBytes(2047)).toBe("2.00 KB")
    })
  })

  describe("boundary conditions", () => {
    it("should handle values at unit boundaries", () => {
      // Just below 1 KB
      expect(formatBytes(1023)).toBe("1023.00 B")
      // Exactly 1 KB
      expect(formatBytes(1024)).toBe("1.00 KB")
      // Just above 1 KB
      expect(formatBytes(1025)).toBe("1.00 KB")

      // Just below 1 MB
      expect(formatBytes(1048575)).toBe("1024.00 KB")
      // Exactly 1 MB
      expect(formatBytes(1048576)).toBe("1.00 MB")
      // Just above 1 MB
      expect(formatBytes(1048577)).toBe("1.00 MB")
    })
  })

  describe("real-world examples", () => {
    it("should format common file sizes", () => {
      // Small text file
      expect(formatBytes(1024)).toBe("1.00 KB")
      // Medium image
      expect(formatBytes(2097152)).toBe("2.00 MB")
      // Large video file
      expect(formatBytes(1073741824)).toBe("1.00 GB")
      // Very large file
      expect(formatBytes(1099511627776)).toBe("1.00 TB")
    })
  })
})
