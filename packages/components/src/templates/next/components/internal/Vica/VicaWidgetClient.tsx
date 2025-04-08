"use client"

import { useEffect } from "react"

import type { VicaWidgetClientProps } from "~/interfaces"

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

    // Only inject the script after everything else has finished loading
    // This is to replicate Next.js lazyOnload behaviour (as recommended for widgets)
    if (document.readyState === "complete") {
      reloadVicaScript()
    } else {
      window.addEventListener("load", reloadVicaScript)
      return () => window.removeEventListener("load", reloadVicaScript)
    }
  }, [])

  return (
    <div
      id="webchat"
      {...vicaProps}
      // We ignore config passed in from DB and manually overwrite
      // the following attributes to ensure consistency and best brand appearance
      app-font-family="Inter, system-ui, sans-serif"
      app-foreground-color="#FFFFFF" // hardcoded to be white for all agencies
      app-color="var(--color-brand-canvas-inverse)"
      app-button-border-color="var(--color-brand-canvas-inverse)"
      app-canvas-background-color="var(--color-brand-canvas-default)"
    />
  )
}
