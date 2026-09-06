import crypto from "node:crypto"

export const generatePassword = () => {
  let password = ""

  // Keep generating until we have at least 12 characters
  while (password.length < 12) {
    const randomString = crypto
      .randomBytes(16)
      .toString("base64")
      .replaceAll(/[+/=]/gu, "")
    password += randomString
  }

  return password.slice(0, 12)
}
