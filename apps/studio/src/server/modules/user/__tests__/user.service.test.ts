import { resetTables } from "tests/integration/helpers/db"
import { setupUser, setUpWhitelist } from "tests/integration/helpers/seed"

import { isUserDeleted } from "../user.service"

describe("user.service", () => {
  beforeAll(async () => {
    await resetTables("User")
    await setUpWhitelist({ email: "@example.com" })

    // Setup active user
    await setupUser({
      name: "Active User",
      userId: "active123",
      email: "active@example.com",
      phone: "12345678",
      isDeleted: false,
    })

    // Setup deleted user
    await setupUser({
      name: "Deleted User",
      userId: "deleted123",
      email: "deleted@example.com",
      phone: "12345678",
      isDeleted: true,
    })
  })

  it("should return false if user is not deleted", async () => {
    // Arrange
    const email = "active@example.com"
    // Act
    const result = await isUserDeleted(email)
    // Assert
    expect(result).toBe(false)
  })

  it("should return true if user is deleted", async () => {
    // Arrange
    const email = "deleted@example.com"
    // Act
    const result = await isUserDeleted(email)
    // Assert
    expect(result).toBe(true)
  })
})
