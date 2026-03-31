export const getCustomErrorMessage = (error: string | undefined): string => {
  if (!error) {
    return ""
  }

  if (error === "is a required property") {
    return "cannot be empty"
  }

  if (error.startsWith("must match pattern")) {
    return "is not in the correct format"
  }

  return error
}
