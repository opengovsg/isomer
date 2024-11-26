import { resetTables } from "tests/integration/helpers/db"
import { setUpWhitelist } from "tests/integration/helpers/seed"

import { isEmailWhitelisted } from "../whitelist.service"

describe("whitelist.service", () => {
  beforeAll(async () => {
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    await resetTables("Whitelist")
    await setUpWhitelist({ email: "whitelisted@example.com" })
    await setUpWhitelist({
      email: "vendor-whitelisted@example.com",
      expiry: oneYearFromNow,
    })
    await setUpWhitelist({
      email: "vendor-expired@example.com",
      expiry: oneYearAgo,
    })
    await setUpWhitelist({ email: ".gov.sg" })
    await setUpWhitelist({
      email: "@vendor.com.sg",
    })
    await setUpWhitelist({
      email: "@whitelisted.com.sg",
      expiry: oneYearFromNow,
    })
    await setUpWhitelist({ email: "@expired.sg", expiry: oneYearAgo })
    await setUpWhitelist({
      email: "expired@whitelisted.com.sg",
      expiry: oneYearAgo,
    })
  })

  it("should show email as whitelisted if the exact email address is whitelisted and expiry is NULL", async () => {
    // Arrange
    const email = "whitelisted@example.com"

    // Act
    const result = await isEmailWhitelisted(email)

    // Assert
    expect(result).toBe(true)
  })

  it("should show email as whitelisted if the exact email address is whitelisted and expiry is in the future", async () => {
    // Arrange
    const email = "vendor-whitelisted@example.com"

    // Act
    const result = await isEmailWhitelisted(email)

    // Assert
    expect(result).toBe(true)
  })

  it("should show email as not whitelisted if the exact email address is whitelisted and expiry is in the past", async () => {
    // Arrange
    const email = "vendor-expired@example.com"

    // Act
    const result = await isEmailWhitelisted(email)

    // Assert
    expect(result).toBe(false)
  })

  it("should show email as whitelisted if the exact email domain is whitelisted and expiry is NULL", async () => {
    // Arrange
    const email = "user@vendor.com.sg"

    // Act
    const result = await isEmailWhitelisted(email)

    // Assert
    expect(result).toBe(true)
  })

  it("should show email as whitelisted if the exact email domain is whitelisted and expiry is in the future", async () => {
    // Arrange
    const email = "user@whitelisted.com.sg"

    // Act
    const result = await isEmailWhitelisted(email)

    // Assert
    expect(result).toBe(true)
  })

  it("should show email as not whitelisted if the exact email domain is whitelisted and expiry is in the past", async () => {
    // Arrange
    const email = "user@expired.sg"

    // Act
    const result = await isEmailWhitelisted(email)

    // Assert
    expect(result).toBe(false)
  })

  it("should show email as whitelisted if the suffix of the email domain is whitelisted and expiry is NULL", async () => {
    // Arrange
    const email = "user@agency.gov.sg"

    // Act
    const result = await isEmailWhitelisted(email)

    // Assert
    expect(result).toBe(true)
  })

  it("should show email as whitelisted if the exact email address is expired, but the domain's expiry is in the future", async () => {
    // Arrange
    const email = "expired@whitelisted.com.sg"

    // Act
    const result = await isEmailWhitelisted(email)

    // Assert
    expect(result).toBe(true)
  })
})
