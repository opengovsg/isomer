"use client"

import { useEffect } from "react"

import type { AskgovWidgetProps } from "~/interfaces"

// Reference: https://github.com/opengovsg/askgov-widget
export const AskgovWidget = ({
  environment,
  ...askgovProps
}: AskgovWidgetProps) => {
  const scriptUrl =
    environment === "production"
      ? "https://script.ask.gov.sg/widget.js"
      : "https://script-staging.ask.gov.sg/widget.js"

  const reloadAskgovScript = () => {
    const scriptId = "isomer-askgov-script"

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
      window.requestIdleCallback(reloadAskgovScript)
    } else {
      // fallback for browsers without requestIdleCallback
      // Use a longer delay to ensure page is fully loaded
      setTimeout(reloadAskgovScript, 2000)
    }
  }, [])

  return <div id="askgov-widget" {...askgovProps} />
}
