"use client"

import { useEffect } from "react"

import type { WizgovWidgetProps } from "~/interfaces"

const reloadWizgovScript = () => {
  const scriptId = "isomer-wizgov-script"

  const existingScriptTag = document.getElementById(scriptId)
  if (existingScriptTag) {
    existingScriptTag.remove()
  }

  const scriptTag = document.createElement("script")
  scriptTag.id = scriptId
  scriptTag.async = true
  scriptTag.type = "text/javascript"
  scriptTag.src = "https://script.wiz.gov.sg/widget.js"
  scriptTag.referrerPolicy = "origin"
  document.body.appendChild(scriptTag)
}

export const WizgovWidgetClient = (props: WizgovWidgetProps) => {
  const { "data-agency": dataAgency } = props

  useEffect(() => {
    // to not render during static site generation on the server
    if (typeof window === "undefined") return

    // Only inject the script after everything else has finished loading
    // This is to replicate Next.js lazyOnload behaviour (as recommended for widgets)
    if (document.readyState === "complete") {
      reloadWizgovScript()
    } else {
      window.addEventListener("load", reloadWizgovScript)
      return () => window.removeEventListener("load", reloadWizgovScript)
    }
  }, [])

  return <div id="wizgov-widget" data-agency={dataAgency} />
}
