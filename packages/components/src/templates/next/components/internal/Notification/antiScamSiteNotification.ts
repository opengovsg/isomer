import type { NotificationTitleContentConfig } from "~/interfaces/internal/Notification"

/** Standard anti-scam GOIS (Government Official Impersonation Scam) disclaimer, aligned with AntiScamDisclaimerBanner. */
export const antiScamSiteNotification = {
  title:
    "Government officials will never ask you to transfer money over a phone call.",
  content: [
    {
      type: "text",
      text: "If you're unsure if something is a scam, call ",
    },
    {
      type: "text",
      text: "ScamShield",
      marks: [
        {
          type: "link",
          attrs: {
            href: "https://www.scamshield.gov.sg",
            target: "_blank",
          },
        },
      ],
    },
    {
      type: "text",
      text: " at 1799.",
    },
  ],
} satisfies NotificationTitleContentConfig
