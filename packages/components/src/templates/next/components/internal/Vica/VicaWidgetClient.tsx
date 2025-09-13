"use client"

import { useEffect } from "react"

import type { VicaWidgetClientProps } from "~/interfaces"
import { isSafari } from "../utils/isSafari"

export const VicaWidgetClient = ({
  environment,
  ...vicaProps
}: VicaWidgetClientProps) => {
  const scriptUrl =
    environment === "production"
      ? "https://webchat.vica.gov.sg/static/js/chat.js"
      : "https://webchat.mol-vica.com/static/js/chat.js"

  // Next.js pre-fetching caused widget to disappear on page navigation
  // Doing this forces the widget to load in between page navigation
  const reloadVicaScript = () => {
    const scriptId = "isomer-vica-script"

    const existingScriptTag = document.getElementById(scriptId)
    if (existingScriptTag) {
      existingScriptTag.remove()
    }

    const scriptTag = document.createElement("script")
    scriptTag.id = scriptId
    scriptTag.async = true
    scriptTag.type = "text/javascript"
    scriptTag.src = scriptUrl
    scriptTag.referrerPolicy = "origin"
    document.body.appendChild(scriptTag)
  }

  useEffect(() => {
    // to not render during static site generation on the server
    if (typeof window === "undefined") return

    // Use requestIdleCallback for better performance when available
    // This ensures the widget loads only when the browser is idle
    // Purpose: so that it does not affect Total Blocking Time (TBT)
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(reloadVicaScript)
      return
    }

    // requestIdleCallback is not supported in Safari
    if (isSafari) {
      if (document.readyState === "complete") {
        reloadVicaScript()
      } else {
        ;(window as Window).addEventListener("load", reloadVicaScript)
        return () => window.removeEventListener("load", reloadVicaScript)
      }
    }

    // fallback for browsers without requestIdleCallback
    // Use a longer delay to ensure page is fully loaded
    setTimeout(reloadVicaScript, 2000)
  }, [])

  return <div id="webchat" {...vicaProps} />
}
