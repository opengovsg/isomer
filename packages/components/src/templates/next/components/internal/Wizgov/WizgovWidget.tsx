"use client"

import { useEffect } from "react"

import type { WizgovWidgetProps } from "~/interfaces"

// Reference: https://github.com/opengovsg/wizgov
export const WizgovWidget = ({
  environment,
  ...wizgovProps
}: WizgovWidgetProps) => {
  const scriptUrl =
    environment === "production"
      ? "https://script.wiz.gov.sg/widget.js"
      : "https://script-staging.wiz.gov.sg/widget.js"

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
      reloadWizgovScript()
    } else {
      window.addEventListener("load", () => reloadWizgovScript())
      return () =>
        window.removeEventListener("load", () => reloadWizgovScript())
    }
  }, [])

  return (
    <div
      id="wizgov-widget"
      data-agency={wizgovProps["data-agency"]}
      {...(!!wizgovProps["data-topic"] && {
        "data-topic": wizgovProps["data-topic"],
      })}
    />
  )
}
