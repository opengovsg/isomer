import type { ContactInformationUIProps } from "~/interfaces"
import { compact } from "lodash-es"

interface FilterContactMethodsProps {
  methods: ContactInformationUIProps["methods"]
  whitelistedMethods?: ContactInformationUIProps["whitelistedMethods"]
}

export const filterContactMethods = ({
  methods,
  whitelistedMethods,
}: FilterContactMethodsProps) => {
  const nonEmptyMethods: ContactInformationUIProps["methods"] = []

  for (const method of methods) {
    if (!Array.isArray(method.values)) {
      continue
    }

    const values = compact(
      method.values.filter(
        (value) => typeof value === "string" && value.trim() !== "",
      ),
    )

    if (values.length > 0) {
      nonEmptyMethods.push({
        ...method,
        values,
      })
    }
  }

  if (!whitelistedMethods) {
    return nonEmptyMethods
  }

  const whitelistedMethodSet = new Set(whitelistedMethods)
  const filteredMethods = nonEmptyMethods.filter(
    (method) => method.method && whitelistedMethodSet.has(method.method),
  )

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
