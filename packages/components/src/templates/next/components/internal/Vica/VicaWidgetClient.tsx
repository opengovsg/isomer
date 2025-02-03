"use client"

import { useEffect } from "react"

import type { VicaProps } from "~/interfaces"

// Next.js pre-fetching caused widget to disappear on page navigation
// Doing this forces the widget to load in between page navigation
const loadVicaScript = () => {
  const scriptTag = document.createElement("script")
  scriptTag.async = true
  scriptTag.type = "text/javascript"
  scriptTag.src = "https://webchat.vica.gov.sg/static/js/chat.js"
  scriptTag.referrerPolicy = "origin"
  document.body.appendChild(scriptTag)
}

export const VicaWidgetClient = (vica: Omit<VicaProps, "site">) => {
  useEffect(() => {
    // to not render during static site generation on the server
    if (typeof window === "undefined") return

    // Only inject the script after everything else has finished loading
    // This is to replicate Next.js lazyOnload behaviour (as recommended for widgets)
    if (document.readyState === "complete") {
      loadVicaScript()
    } else {
      window.addEventListener("load", loadVicaScript)
      return () => window.removeEventListener("load", loadVicaScript)
    }
  }, [])

  return (
    <div
      id="webchat"
      {...vica}
      app-font-family="Inter, system-ui, sans-serif"
      // NOTE: Clarifying with VICA regarding color scheme
      // Once confirmed, will override with site's color scheme for consistency
    />
  )
}
