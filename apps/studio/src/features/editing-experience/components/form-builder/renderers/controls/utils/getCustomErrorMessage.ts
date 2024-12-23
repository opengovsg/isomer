export const getCustomErrorMessage = (error: string | undefined): string => {
  if (error === "is a required property") {
    return "cannot be empty"
  }
  return error ?? ""
}
