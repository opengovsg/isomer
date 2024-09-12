import type { ErrorObject } from "ajv"
import type { Dispatch, SetStateAction } from "react"
import { createContext, useCallback, useContext, useState } from "react"
import { runIfFn } from "@chakra-ui/utils"

import type { MaybeRenderProp } from "~/types/propTypes"

type MappedErrorObject = Record<string, ErrorObject[]>
const ErrorContext = createContext<{
  errors: MappedErrorObject
  setErrors: Dispatch<SetStateAction<MappedErrorObject>>
  hasErrorAt: (path: string) => boolean
} | null>(null)

export const ErrorProvider = ({
  children,
}: {
  children?: MaybeRenderProp<{
    setErrors: Dispatch<SetStateAction<MappedErrorObject>>
  }>
}) => {
  const [errors, setErrors] = useState<MappedErrorObject>({})

  const hasErrorAt = useCallback(
    (path: string) => {
      return !!errors[path]?.[0]?.message
    },
    [errors],
  )

  return (
    <ErrorContext.Provider
      value={{
        errors,
        setErrors,
        hasErrorAt,
      }}
    >
      {runIfFn(children, { setErrors })}
    </ErrorContext.Provider>
  )
}

export const useBuilderErrors = () => {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error("useBuilderErrors must be used within a ErrorProvider")
  }
  return context
}
