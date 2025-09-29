const crypto = require("crypto")

export const generatePassword = () => {
  let password = ""

  // Keep generating until we have at least 12 characters
  while (password.length < 12) {
    const randomString = crypto
      .randomBytes(16)
      .toString("base64")
      .replace(/[+/=]/g, "")
    password += randomString
  }

  return password.substring(0, 12)
}
