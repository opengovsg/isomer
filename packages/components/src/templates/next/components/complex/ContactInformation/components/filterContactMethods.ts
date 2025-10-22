import type { ContactInformationUIProps } from "~/interfaces"

interface FilterContactMethodsProps {
  methods: ContactInformationUIProps["methods"]
  whitelistedMethods?: ContactInformationUIProps["whitelistedMethods"]
}

export const filterContactMethods = ({
  methods,
  whitelistedMethods,
}: FilterContactMethodsProps) => {
  const nonEmptyMethods = methods.filter(
    (method) =>
      Array.isArray(method.values) &&
      method.values.filter(
        (value) => typeof value === "string" && value.trim() !== "",
      ).length > 0,
  )

  if (!whitelistedMethods) {
    return nonEmptyMethods
  }

  // Filter methods that have a valid method type and are whitelisted
  const filteredMethods = nonEmptyMethods.filter(
    (method) => method.method && whitelistedMethods.includes(method.method),
  )

  // Sort the filtered methods according to the order in whitelistedMethods
  const sortedMethods = whitelistedMethods.flatMap((whitelistedMethod) =>
    filteredMethods.filter((method) => method.method === whitelistedMethod),
  )

  return sortedMethods
}
