import type { PropsWithChildren } from "react"
import type {
  LinkTypeMapping,
  LinkTypes,
} from "~/features/editing-experience/components/LinkEditor/constants"
import { createContext, useContext, useState } from "react"

import { getLinkHrefType } from "./utils"

type LinkEditorContextReturn = ReturnType<typeof useLinkEditorContext>
const LinkEditorContext = createContext<LinkEditorContextReturn | undefined>(
  undefined,
)

interface UseLinkEditorContextProps {
  linkHref: string
  linkTypes: Partial<LinkTypeMapping>
  error?: string
  onChange: (value: string) => void
}
const useLinkEditorContext = ({
  linkHref,
  linkTypes,
  error,
  onChange,
}: UseLinkEditorContextProps) => {
  const [curType, setCurType] = useState<LinkTypes>(() =>
    getLinkHrefType(linkHref),
  )
  const [curHref, setHref] = useState(linkHref)

  return {
    linkTypes,
    curHref,
    setHref: (value: string) => {
      onChange(value)
      setHref(value)
    },
    error,
    curType,
    setCurType,
  }
}

export const LinkEditorContextProvider = ({
  children,
  ...passthroughProps
}: PropsWithChildren<UseLinkEditorContextProps>) => {
  const values = useLinkEditorContext(passthroughProps)
  return (
    <LinkEditorContext.Provider value={values}>
      {children}
    </LinkEditorContext.Provider>
  )
}

export const useLinkEditor = () => {
  const context = useContext(LinkEditorContext)
  if (!context) {
    throw new Error(
      `useLinkEditor must be used within a LinkEditorContextProvider component`,
    )
  }
  return context
}
