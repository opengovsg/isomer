import type { IsomerSitemap } from "@opengovsg/isomer-components"
import type { CSSProperties } from "react"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import sitemap from "@/sitemap.json"

const timeNow = new Date()
const lastUpdated =
  timeNow.getDate().toString().padStart(2, "0") +
  " " +
  timeNow.toLocaleString("default", { month: "short" }) +
  " " +
  timeNow.getFullYear()

export const getSiteContext = () => ({
  config,
  footer,
  navbar,
  sitemap: sitemap as IsomerSitemap,
  lastUpdated,
  environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
  assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
  isomerMsClarityId: process.env.NEXT_PUBLIC_ISOMER_MICROSOFT_CLARITY_ID,
})

export const getLocalThemeStyle = (): CSSProperties | undefined =>
  process.env.NODE_ENV === "development"
    ? ({
        "--color-brand-canvas-default": config.colors.brand.canvas.default,
        "--color-brand-canvas-alt": config.colors.brand.canvas.alt,
        "--color-brand-canvas-backdrop": config.colors.brand.canvas.backdrop,
        "--color-brand-canvas-inverse": config.colors.brand.canvas.inverse,
        "--color-brand-interaction-default":
          config.colors.brand.interaction.default,
        "--color-brand-interaction-hover":
          config.colors.brand.interaction.hover,
        "--color-brand-interaction-pressed":
          config.colors.brand.interaction.pressed,
      } as CSSProperties)
    : undefined
