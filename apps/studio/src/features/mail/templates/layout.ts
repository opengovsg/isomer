import { env } from "~/env.mjs"
import { getBaseUrl } from "~/utils/getBaseUrl"

import { escapeHtml } from "../utils"

// Shared shell for Studio emails. The OTP email is the first to use it; other
// emails can move onto it by passing their own `content`.
//
// Email clients (classic Outlook for Windows in particular) render with a
// limited HTML engine, so this deliberately uses tables, inline styles and
// `bgcolor` attributes instead of modern CSS. The <style> block only carries
// progressive enhancements (dark mode); everything must still read without it.

const COLORS = {
  pageBackground: "#EEF2FB",
  cardBackground: "#FFFFFF",
  cardBorder: "#DCE3F3",
  text: "#1F2430",
  mutedText: "#6B7280",
  divider: "#E6E8EE",
  link: "#2B5FCE",
  codeBackground: "#EEF3FC",
  codeBorder: "#C9D6F5",
  codeText: "#1B3A80",
  calloutBackground: "#F5F6F8",
  calloutBorder: "#D5D7DB",
} as const

const FONT_FAMILY = "Arial, Helvetica, sans-serif"

// Displayed at 113x32; the PNGs are exported at 3x for high-density screens.
const LOGO_WIDTH = 113
const LOGO_HEIGHT = 32

const getAssetUrl = (path: string) => new URL(path, getBaseUrl()).toString()

// e.g. "" in production, " (Staging)" in staging
export const getEnvironmentLabel = () => {
  const appEnv = env.NEXT_PUBLIC_APP_ENV
  if (!appEnv || appEnv === "production") return ""
  return ` (${appEnv.charAt(0).toUpperCase()}${appEnv.slice(1)})`
}

// A link whose visible text is exactly the host it points to, so users can
// check where it goes. Always the deployment that sent the email.
export const renderStudioLink = () => {
  const url = new URL(getBaseUrl())
  return `<a href="${escapeHtml(url.origin)}" target="_blank" style="color: ${COLORS.link}; text-decoration: underline; font-weight: bold;">${escapeHtml(url.host)}</a>`
}

export const renderParagraph = (html: string) =>
  `<p style="margin: 0 0 16px; font-family: ${FONT_FAMILY}; font-size: 15px; line-height: 24px; color: ${COLORS.text};">${html}</p>`

export const renderHeading = (text: string) =>
  `<h1 style="margin: 0 0 20px; font-family: ${FONT_FAMILY}; font-size: 22px; line-height: 30px; font-weight: bold; color: ${COLORS.text};">${text}</h1>`

export const renderLink = (href: string, text: string) =>
  `<a href="${href}" style="color: ${COLORS.link}; text-decoration: underline;">${text}</a>`

// Code shown in its own cell so double-click / long-press selects only the
// code. Spacing between characters is CSS letter-spacing only: real spaces
// would break whole-word selection and paste.
export const renderCodeBox = ({
  code,
  prefix,
}: {
  code: string
  prefix?: string
}) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px; border-collapse: separate;">
  <tr>
    ${
      prefix
        ? `<td class="code-prefix" valign="middle" style="padding: 0 12px 0 0; font-family: ${FONT_FAMILY}; font-size: 18px; line-height: 24px; color: ${COLORS.mutedText}; white-space: nowrap;">${prefix}&nbsp;&ndash;</td>`
        : ""
    }
    <td class="code-box" valign="middle" bgcolor="${COLORS.codeBackground}" style="background-color: ${COLORS.codeBackground}; border: 1px solid ${COLORS.codeBorder}; border-radius: 6px; padding: 12px 16px 12px 20px; font-family: ${FONT_FAMILY}; font-size: 28px; line-height: 36px; font-weight: bold; letter-spacing: 4px; color: ${COLORS.codeText}; white-space: nowrap;">${code}</td>
  </tr>
</table>`

// The grey "note" callout from the Isomer component library. Grey so it
// doesn't compete with the blue code box. Use at most once per email so it
// keeps its meaning. A bordered table cell, because classic Outlook drops
// borders on <div>s (it also squares the corners, which is acceptable).
export const renderCallout = (html: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 16px; border-collapse: separate;">
  <tr>
    <td class="callout" bgcolor="${COLORS.calloutBackground}" style="background-color: ${COLORS.calloutBackground}; border: 1px solid ${COLORS.calloutBorder}; border-radius: 8px; padding: 16px 20px; font-family: ${FONT_FAMILY}; font-size: 15px; line-height: 24px; color: ${COLORS.text};">${html}</td>
  </tr>
</table>`

// Dark mode is best-effort: Apple Mail and some Outlooks honour these rules,
// Gmail ignores them and inverts colours itself (the outlined logo covers
// that case). `[data-ogsc]` / `[data-ogsb]` are how Outlook.com and the
// Outlook apps mark dark mode.
const DARK_MODE_STYLES = `
  .logo-dark { display: none; }
  @media (prefers-color-scheme: dark) {
    body, .page { background-color: #1A2233 !important; }
    .card { background-color: #202124 !important; border-color: #34415E !important; }
    .card h1, .card p, .card td { color: #E3E3E3 !important; }
    .card a { color: #8AB4F8 !important; }
    .card .code-prefix { color: #9AA0A6 !important; }
    .card .code-box { background-color: #1E2A44 !important; border-color: #3A4E7A !important; color: #C9D8FF !important; }
    .card .callout { background-color: #2A2B2E !important; border-color: #4A4C50 !important; }
    .card .footer { border-top-color: #3C4043 !important; color: #9AA0A6 !important; }
    .logo-light { display: none !important; }
    .logo-dark { display: block !important; max-height: none !important; }
  }
  [data-ogsc] .logo-light { display: none !important; }
  [data-ogsc] .logo-dark { display: block !important; max-height: none !important; }
`

const renderLogo = () => {
  const img = (className: string, src: string, extraStyle = "") =>
    `<img class="${className}" src="${escapeHtml(getAssetUrl(src))}" width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" alt="Isomer" style="display: block; width: ${LOGO_WIDTH}px; height: ${LOGO_HEIGHT}px; border: 0; outline: none; text-decoration: none; font-family: ${FONT_FAMILY}; font-size: 22px; font-weight: bold; color: ${COLORS.text};${extraStyle}" />`

  // The dark logo is hidden by default and never shown in classic Outlook.
  return `${img("logo-light", "/assets/email/isomer-logo-email.png")}
<!--[if !mso]><!-->${img("logo-dark", "/assets/email/isomer-logo-email-dark.png", " display: none; max-height: 0; overflow: hidden;")}<!--<![endif]-->`
}

// Hidden text shown by inbox lists as the preview snippet. The trailing
// zero-width characters stop clients pulling body text into the preview.
const renderPreheader = (text: string) =>
  `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: ${COLORS.pageBackground};">${text}${"&#847;&zwnj;&nbsp;".repeat(40)}</div>`

export const FOOTER_TEXT =
  "This is an auto-generated message. Please do not reply to this email."

export const renderEmailLayout = ({
  preheader,
  content,
}: {
  preheader: string
  content: string
}) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<style>${DARK_MODE_STYLES}</style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.pageBackground};">
${renderPreheader(preheader)}
<table class="page" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.pageBackground}" style="background-color: ${COLORS.pageBackground};">
  <tr>
    <td align="center" style="padding: 32px 16px;">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table class="card" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.cardBackground}" style="max-width: 600px; background-color: ${COLORS.cardBackground}; border: 1px solid ${COLORS.cardBorder}; border-radius: 8px;">
        <tr>
          <td style="padding: 32px;">
            <div style="margin: 0 0 28px;">${renderLogo()}</div>
            ${content}
            <p class="footer" style="margin: 24px 0 0; padding: 16px 0 0; border-top: 1px solid ${COLORS.divider}; font-family: ${FONT_FAMILY}; font-size: 12px; line-height: 18px; color: ${COLORS.mutedText};">${FOOTER_TEXT}</p>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`
