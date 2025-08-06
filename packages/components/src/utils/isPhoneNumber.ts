// Note: this is a very basic phone number validation that
// only checks if the phone number is a valid international phone number
// by making sure it starts with a country code and has 1-14 digits
export const isPhoneNumber = (phone: string): boolean => {
  // wrap in try-catch as this is being used in runtime
  try {
    // Remove all whitespace and common phone number separators
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, "")

    // Generic international phone number validation
    // Allows country codes (+1, +44, etc.) and various formats
    // Minimum 3 digits, maximum 20 digits total
    // 20 because country code (3) + max digits (17)
    const internationalPattern = /^\+?[1-9]\d{3,20}$/

    return internationalPattern.test(cleanPhone)
  } catch {
    return false
  }
}
