import type { Meta, StoryObj } from "@storybook/nextjs"
import { useState } from "react"
import { templates } from "~/features/mail/templates"

import { withChromaticModes } from "@isomer/storybook-config"

// Preview environments use a static OTP and never send the email, so this is
// the way to review it without a real send. It renders the exact HTML the
// template produces. The Studio link shows this Storybook's host, because the
// email always links to the deployment that sent it.

interface OtpEmailPreviewProps {
  otpPrefix: string
  token: string
  expiryMinutes: number
  // Forces the email's own dark-mode rules on, as Apple Mail and some
  // Outlooks apply them. Gmail ignores them and inverts colours itself.
  forceDarkMode?: boolean
  // Shows what users see before they allow images, e.g. in Outlook
  blockImages?: boolean
}

const OtpEmailPreview = ({
  otpPrefix,
  token,
  expiryMinutes,
  forceDarkMode = false,
  blockImages = false,
}: OtpEmailPreviewProps) => {
  const [height, setHeight] = useState(720)
  const { subject, body } = templates.otp({
    recipientEmail: "jane@open.gov.sg",
    otpPrefix,
    token,
    expiryMinutes,
  })

  let html = body
  if (forceDarkMode) {
    html = html.replace("@media (prefers-color-scheme: dark)", "@media all")
  }
  if (blockImages) {
    html = html.replaceAll(/src="[^"]*\/assets\/email\/[^"]*"/g, 'src=""')
  }

  return (
    <div style={{ maxWidth: 680, fontFamily: "Arial, sans-serif" }}>
      <p style={{ margin: "0 0 12px", fontSize: 14 }}>
        <strong>Subject:</strong> {subject}
      </p>
      <iframe
        title="OTP email preview"
        srcDoc={html}
        style={{ width: "100%", height, border: "1px solid #E6E8EE" }}
        onLoad={(e) => {
          const doc = e.currentTarget.contentDocument
          if (doc) setHeight(doc.documentElement.scrollHeight)
        }}
      />
    </div>
  )
}

const meta: Meta<typeof OtpEmailPreview> = {
  title: "Emails/OTP Email",
  component: OtpEmailPreview,
  parameters: {
    layout: "padded",
    chromatic: withChromaticModes(["gsib", "mobile"]),
  },
  args: {
    otpPrefix: "MZS",
    token: "JHDZRB",
    expiryMinutes: 10,
  },
}

export default meta
type Story = StoryObj<typeof OtpEmailPreview>

export const Default: Story = {}

export const DarkMode: Story = {
  args: { forceDarkMode: true },
}

export const ImagesBlocked: Story = {
  args: { blockImages: true },
}
