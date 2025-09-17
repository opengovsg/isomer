"use client"

import { useEffect } from "react"

import type {
  HomepageSearchSGInputBoxProps,
  NavbarSearchSGInputBoxProps,
} from "~/interfaces"
import { twMerge } from "~/lib/twMerge"

const SEARCHSG_CONFIG_ID = "searchsg-config"

export const NavbarSearchSGInputBox = ({
  clientId,
  isOpen,
}: Omit<NavbarSearchSGInputBoxProps, "type">) => {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const existingScriptTag = document.getElementById(SEARCHSG_CONFIG_ID)
    if (existingScriptTag) {
      existingScriptTag.remove()
    }

    const scriptTag = document.createElement("script")
    scriptTag.id = SEARCHSG_CONFIG_ID
    scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${clientId}`
    scriptTag.setAttribute("defer", "")
    document.body.appendChild(scriptTag)
  }, [clientId, isOpen])

  return <div id="searchsg-searchbar" className="h-[3.25rem] lg:h-16" />
}

export const HomepageSearchSGInputBox = ({
  clientId,
  className,
}: Omit<HomepageSearchSGInputBoxProps, "type">) => {
  useEffect(() => {
    const existingScriptTag = document.getElementById(SEARCHSG_CONFIG_ID)
    if (existingScriptTag) {
      existingScriptTag.remove()
    }

    const scriptTag = document.createElement("script")
    scriptTag.id = SEARCHSG_CONFIG_ID
    scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${clientId}`
    scriptTag.setAttribute("defer", "")
    document.body.appendChild(scriptTag)
  }, [clientId])

  return (
    <div
      id="searchsg-searchbar"
      className={twMerge("h-[3.25rem] lg:h-16", className)}
    />
  )
}
