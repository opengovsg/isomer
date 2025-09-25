import type { ContactInformationUIProps } from "~/interfaces"

interface FilterContactMethodsProps {
  methods: ContactInformationUIProps["methods"]
  whitelistedMethods?: ContactInformationUIProps["whitelistedMethods"]
}

export const filterContactMethods = ({
  methods,
  whitelistedMethods,
}: FilterContactMethodsProps) => {
  if (!whitelistedMethods) {
    return methods
  }

  const filteredMethodsInOrder = whitelistedMethods.map((whitelistedMethod) =>
    methods.find((method) => method.method === whitelistedMethod),
  )

  const definedFilteredMethods = filteredMethodsInOrder.filter(
    (method): method is NonNullable<typeof method> => method !== undefined,
  )

  return definedFilteredMethods
}
