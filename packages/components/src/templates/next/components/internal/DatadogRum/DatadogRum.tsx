"use client"

import { datadogRum } from "@datadog/browser-rum"

const PUBLIC_DD_RUM_CLIENT_TOKEN = "pub277c32b9cf49ccee087ec9dc83d62438"
const PUBLIC_RUM_APPLICATION_ID = "3516693f-2249-4677-b962-5bfa96d5f556"

if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
  datadogRum.init({
    applicationId: PUBLIC_RUM_APPLICATION_ID,
    clientToken: PUBLIC_DD_RUM_CLIENT_TOKEN,
    site: "datadoghq.com",
    service: "isomer-next-sites",
    env: "production",
    sessionSampleRate: Number(
      process.env.NEXT_PUBLIC_ISOMER_NEXT_RUM_SAMPLING_RATE ?? 0,
    ),
    sessionReplaySampleRate: Number(
      process.env.NEXT_PUBLIC_ISOMER_NEXT_RUM_SAMPLING_RATE ?? 0,
    ),
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: "allow",
  })
}

export const DatadogRum = () => {
  // Render nothing - this component is only included so that the init code
  // above will run client-side
  return <></>
}
