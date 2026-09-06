import type { ContactInformationUIProps } from "~/interfaces"
import { compact } from "lodash-es"

interface FilterContactMethodsProps {
  methods: ContactInformationUIProps["methods"]
  whitelistedMethods?: ContactInformationUIProps["whitelistedMethods"]
}

type ExternalContactValue = string | number | boolean | null | undefined

const isNonEmptyContactValue = (value: ExternalContactValue): boolean => {
  if (value === null || value === undefined) return false
  if (String(value) !== value) return false
  return value.trim() !== ""
}

export const filterContactMethods = ({
  methods,
  whitelistedMethods,
}: FilterContactMethodsProps) => {
  const nonEmptyMethods: ContactInformationUIProps["methods"] = []

  // First, filter out empty values from each method's values array
  for (const method of methods) {
    if (!Array.isArray(method.values)) {
      continue
    }

    const values = compact(method.values.filter(isNonEmptyContactValue))

    if (values.length > 0) {
      nonEmptyMethods.push({
        ...method,
        values,
      })
    }
  }

  // Then filter out methods that have no non-empty values
  if (!whitelistedMethods) {
    return nonEmptyMethods
  }

  // Filter methods that have a valid method type and are whitelisted
  const whitelistedMethodSet = new Set(whitelistedMethods)
  const filteredMethods = nonEmptyMethods.filter(
    (method) => method.method && whitelistedMethodSet.has(method.method),
  )

  // Sort the filtered methods according to the order in whitelistedMethods
  const sortedMethods: ContactInformationUIProps["methods"] = []

  for (const whitelistedMethod of whitelistedMethods) {
    for (const method of filteredMethods) {
      if (method.method === whitelistedMethod) {
        sortedMethods.push(method)
      }
    }
  }

  return sortedMethods
}
