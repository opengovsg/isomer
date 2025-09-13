"use client"

import { useEffect } from "react"

import type { VicaStylesheetProps } from "~/interfaces"
import { isSafari } from "../utils/isSafari"

// not using <link href={stylesheetUrl} referrerPolicy="origin" rel="stylesheet" />
// because link is render blocking by default
export const VicaStylesheet = ({ environment }: VicaStylesheetProps) => {
  const stylesheetUrl =
    environment === "production"
      ? "https://webchat.vica.gov.sg/static/css/chat.css"
      : "https://webchat.mol-vica.com/static/css/chat.css"

  const loadStylesheet = () => {
    const linkId = "vica-chat-stylesheet"

    const existingLinkTag = document.getElementById(linkId)
    if (existingLinkTag) {
      existingLinkTag.remove()
    }

    const link = document.createElement("link")
    link.id = linkId
    link.rel = "stylesheet"
    link.href = stylesheetUrl
    link.referrerPolicy = "origin"
    document.head.appendChild(link)
  }

  useEffect(() => {
    // to not render during static site generation on the server
    if (typeof window === "undefined") return

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(loadStylesheet)
      return
    }

    if (isSafari) {
      if (document.readyState === "complete") {
        loadStylesheet()
      } else {
        ;(window as Window).addEventListener("load", loadStylesheet)
        return () => window.removeEventListener("load", loadStylesheet)
      }
    }

    setTimeout(loadStylesheet, 2000)
  }, [])

  return null
}
