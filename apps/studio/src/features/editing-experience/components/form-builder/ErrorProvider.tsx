import type { ErrorObject } from "ajv"
import type { Dispatch, PropsWithChildren, SetStateAction } from "react"
import { createContext, useCallback, useContext, useState } from "react"

type MappedErrorObject = Record<string, ErrorObject[]>
const ErrorContext = createContext<{
  errors: MappedErrorObject
  setErrors: Dispatch<SetStateAction<MappedErrorObject>>
  hasErrorAt: (path: string) => boolean
} | null>(null)

export const ErrorProvider = ({ children }: PropsWithChildren) => {
  const [errors, setErrors] = useState<MappedErrorObject>({})

  const hasErrorAt = useCallback(
    (path: string) => {
      // Convert path in the form of x.y to /x/y.
      const convertedPath = `/${path.replace(/\./g, "/")}`
      return Object.keys(errors).some(
        (errorPath) =>
          errorPath === convertedPath ||
          errorPath.startsWith(convertedPath + "/"),
      )
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
      {children}
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
