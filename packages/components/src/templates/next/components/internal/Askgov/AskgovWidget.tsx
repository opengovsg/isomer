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

    // Only inject the script after everything else has finished loading
    // This is to replicate Next.js lazyOnload behaviour (as recommended for widgets)
    if (document.readyState === "complete") {
      reloadAskgovScript()
    } else {
      window.addEventListener("load", () => reloadAskgovScript())
      return () =>
        window.removeEventListener("load", () => reloadAskgovScript())
    }
  }, [])

  return <div id="askgov-widget" {...askgovProps} />
}
