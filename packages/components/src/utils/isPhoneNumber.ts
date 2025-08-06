// Note: this is a very basic phone number validation that
// only checks if the phone number is a valid international phone number
// by making sure it starts with a country code and has 1-14 digits
export const isPhoneNumber = (phone: string): boolean => {
  // wrap in try-catch as this is being used in runtime
  try {
    if (typeof phone !== "string") {
      return false
    }

    // Remove all whitespace and common phone number separators
    const cleanPhone = sanitizePhoneNumber(phone)

    // Generic international phone number validation
    // Allows country codes (+1, +44, etc.) and various formats
    // Minimum 3 digits, maximum 20 digits total
    // 20 because country code (1 + 2) + max digits (17)
    // 1 value in front because countrycode must start with 1-9
    const internationalPattern = /^\+?[1-9]\d{2,19}$/

    return internationalPattern.test(cleanPhone)
  } catch {
    return false
  }
}

// Remove all whitespace and common phone number separators
export const sanitizePhoneNumber = (phone: string): string => {
  // wrap in try-catch as this is being used in runtime
  try {
    return phone.replace(/[\s\-\(\)\.]/g, "")
  } catch {
    return phone
  }
}
