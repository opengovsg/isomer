import { resetTables } from "tests/integration/helpers/db"
import { setupUser } from "tests/integration/helpers/seed"

import { isUserDeleted } from "../user.service"

describe("user.service", () => {
  beforeAll(async () => {
    await resetTables("User")
  })

  it("should return false if user is not deleted", async () => {
    // Arrange
    const email = "active@example.com"
    // Setup active user
    await setupUser({
      email: email,
      isDeleted: false,
    })

    // Act
    const result = await isUserDeleted(email)
    // Assert
    expect(result).toBe(false)
  })

  it("should return true if user is deleted", async () => {
    // Arrange
    const email = "deleted@example.com"
    // Setup deleted user
    await setupUser({
      email: email,
      isDeleted: true,
    })

    // Act
    const result = await isUserDeleted(email)
    // Assert
    expect(result).toBe(true)
  })
})
