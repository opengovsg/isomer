import type { ErrorObject } from "ajv"

const toInstancePath = (path: string) => `/${path.replace(/\./g, "/")}`

/** AJV errors for a JsonForms control path (includes required errors on the parent object). */
export const getBuilderFieldErrorMessage = (
  path: string,
  errors: Record<string, ErrorObject[]>,
): string | undefined => {
  const instancePath = toInstancePath(path)
  const fieldName = path.split(".").pop()
  const messages: string[] = []

  for (const error of errors[instancePath] ?? []) {
    if (error.message) {
      messages.push(error.message)
    }
  }

  if (fieldName) {
    const parentPath = instancePath.replace(/\/[^/]+$/, "")
    for (const error of errors[parentPath] ?? []) {
      if (
        error.keyword === "required" &&
        error.params?.missingProperty === fieldName &&
        error.message
      ) {
        messages.push(error.message)
      }
    }
  }

  return messages.length > 0 ? messages.join("\n") : undefined
}
