import type { ComponentType } from "react"
import type {
  ArticlePageSchemaType,
  HomePageSchemaType,
} from "@opengovsg/isomer-components"
import { renderLayout } from "@opengovsg/isomer-components/templates/next"
import { createPortal } from "react-dom"
import { useEffect, useLayoutEffect, useState } from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import { articleData } from "./data/article"
import { contentData } from "./data/content"
import { homeData } from "./data/home"
import { SITE_HOME_DATA } from "./data/sites"
import {
  HeroCollage,
  HeroBlobSaaS,
  TableStyled,
  CardsCarousel,
  ArticleLayoutAlt,
  ContentLayoutAlt,
  CUSTOM_BLOCK_PAGE,
  CUSTOM_BLOCK_LABEL,
  CUSTOM_BLOCK_IS_HERO,
} from "./components/custom"

type PageType = "home" | "article" | "content"

const CUSTOM_BLOCK_REGISTRY: Record<string, ComponentType> = {
  "hero-collage": HeroCollage,
  "hero-blob-saas": HeroBlobSaaS,
  "table-styled": TableStyled,
  "cards-carousel": CardsCarousel,
}

function applyThemeVars(vars: Record<string, string>) {
  const root = document.documentElement
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v)
  }
}

// ─── Portal helpers ────────────────────────────────────────────────────────

/** Get or create a portal <div> with the given id, placed BEFORE the anchor. */
function getOrCreatePortalBefore(
  anchor: Element,
  portalId: string,
): HTMLElement {
  let el = document.getElementById(portalId)
  if (!el) {
    el = document.createElement("div")
    el.id = portalId
    anchor.before(el)
  }
  return el
}

/** Get or create a portal <div> with the given id, placed AFTER the anchor. */
function getOrCreatePortalAfter(
  anchor: Element,
  portalId: string,
): HTMLElement {
  let el = document.getElementById(portalId)
  if (!el) {
    el = document.createElement("div")
    el.id = portalId
    anchor.after(el)
  }
  return el
}

/** Remove a portal element and restore a hidden element's display. */
function teardown(portalId: string, hiddenEl?: HTMLElement | null) {
  document.getElementById(portalId)?.remove()
  if (hiddenEl) hiddenEl.style.display = ""
}

// ─── App ───────────────────────────────────────────────────────────────────

function App() {
  const initial =
    (new URLSearchParams(window.location.search).get("page") as PageType) ||
    "home"
  const [page, setPage] = useState<PageType>(initial)
  const [homePage, setHomePage] = useState<HomePageSchemaType>(homeData)
  const [customBlocks, setCustomBlocks] = useState<
    Record<string, string[]>
  >({})
  const [layoutOverrides, setLayoutOverrides] = useState<
    Record<string, string | null>
  >({})

  // Portal DOM nodes
  const [heroPortal, setHeroPortal] = useState<HTMLElement | null>(null)
  const [afterHeroPortal, setAfterHeroPortal] =
    useState<HTMLElement | null>(null)
  const [articleHeaderPortal, setArticleHeaderPortal] =
    useState<HTMLElement | null>(null)
  const [contentHeaderPortal, setContentHeaderPortal] =
    useState<HTMLElement | null>(null)

  // ── Message handler ──────────────────────────────────────────────────────

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data) return
      const { type } = e.data
      if (type === "theme") applyThemeVars(e.data.vars)
      if (type === "page") setPage(e.data.page as PageType)
      if (type === "sitePreset") {
        const preset =
          SITE_HOME_DATA[e.data.preset as keyof typeof SITE_HOME_DATA]
        if (preset) setHomePage(preset)
      }
      if (type === "fonts") {
        document.documentElement.style.setProperty(
          "--font-heading",
          e.data.heading,
        )
        document.documentElement.style.setProperty("--font-body", e.data.body)
      }
      if (type === "addBlock") {
        const { blockId, page: bp } = e.data as {
          blockId: string; page: string
        }
        setCustomBlocks((prev) => {
          const cur = prev[bp] ?? []
          if (cur.includes(blockId)) return prev
          return { ...prev, [bp]: [...cur, blockId] }
        })
        setPage(bp as PageType)
      }
      if (type === "removeBlock") {
        const { blockId, page: bp } = e.data as {
          blockId: string; page: string
        }
        setCustomBlocks((prev) => ({
          ...prev,
          [bp]: (prev[bp] ?? []).filter((id) => id !== blockId),
        }))
      }
      if (type === "setLayoutVariant") {
        const { variantId, page: vp } = e.data as {
          variantId: string | null; page: string
        }
        setLayoutOverrides((prev) => ({ ...prev, [vp]: variantId }))
        setPage(vp as PageType)
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  // ── Portal setup (reset-and-rebuild on every relevant change) ────────────

  const activeCustomBlocks = customBlocks[page] ?? []
  const hasHeroBlock = activeCustomBlocks.some((id) => CUSTOM_BLOCK_IS_HERO[id])
  const hasAfterHeroBlock = activeCustomBlocks.some(
    (id) => !CUSTOM_BLOCK_IS_HERO[id] && CUSTOM_BLOCK_PAGE[id] === "home",
  )
  const activeLayoutOverride = layoutOverrides[page] ?? null

  useLayoutEffect(() => {
    // Reset React portal state so stale portals don't re-render
    // (actual DOM portal nodes are removed inside attempt() before querying)
    setHeroPortal(null)
    setAfterHeroPortal(null)
    setArticleHeaderPortal(null)
    setContentHeaderPortal(null)

    const attempt = () => {
      // ── Homepage ──────────────────────────────────────────────────────
      if (page === "home") {
        // CRITICAL: remove portal divs BEFORE querying — they shift :first-child
        document.getElementById("hero-portal")?.remove()
        document.getElementById("after-hero-portal")?.remove()

        const contentDiv = document.querySelector("main > div") as HTMLElement
        if (!contentDiv) return false

        // Now ":first-child" is reliable (no portal divs in the way)
        const heroSection = contentDiv.querySelector(
          ":scope > section:first-child",
        ) as HTMLElement | null
        if (!heroSection) return false

        heroSection.style.display = ""

        if (hasHeroBlock) {
          heroSection.style.display = "none"
          setHeroPortal(getOrCreatePortalBefore(heroSection, "hero-portal"))
        }
        if (hasAfterHeroBlock) {
          setAfterHeroPortal(
            getOrCreatePortalAfter(heroSection, "after-hero-portal"),
          )
        }
        return true
      }

      // ── Article ───────────────────────────────────────────────────────
      if (page === "article") {
        // Remove portal before querying
        document.getElementById("article-header-portal")?.remove()

        const mainEl = document.querySelector("main") as HTMLElement
        if (!mainEl) return false
        const narrowCol = mainEl.querySelector(":scope > div") as HTMLElement | null
        if (!narrowCol) return false
        const headerDiv = narrowCol.querySelector(
          ":scope > div:first-child",
        ) as HTMLElement | null
        if (!headerDiv) return false

        headerDiv.style.display = ""

        if (activeLayoutOverride === "article-alt") {
          headerDiv.style.display = "none"
          // Insert portal at <main> level (before narrowCol) for full-bleed
          const portal = getOrCreatePortalBefore(narrowCol, "article-header-portal")
          setArticleHeaderPortal(portal)
        }
        return true
      }

      // ── Content ───────────────────────────────────────────────────────
      if (page === "content") {
        // Remove portal before querying
        document.getElementById("content-header-portal")?.remove()

        const mainEl = document.querySelector("main") as HTMLElement
        if (!mainEl) return false

        // ContentPageHeader is the first <div> child of <main>
        const headerDiv = mainEl.querySelector(
          ":scope > div:first-child",
        ) as HTMLElement | null
        if (!headerDiv) return false

        headerDiv.style.display = ""

        if (activeLayoutOverride === "content-alt") {
          headerDiv.style.display = "none"
          setContentHeaderPortal(
            getOrCreatePortalBefore(headerDiv, "content-header-portal"),
          )
        }
        return true
      }

      return true
    }

    if (!attempt()) {
      const timer = setTimeout(attempt, 100)
      return () => clearTimeout(timer)
    }
  }, [page, JSON.stringify(activeCustomBlocks), activeLayoutOverride])

  // ── Render ────────────────────────────────────────────────────────────────

  const pageData = { home: homePage, article: articleData, content: contentData }

  const heroBlocks = activeCustomBlocks.filter((id) => CUSTOM_BLOCK_IS_HERO[id])
  const afterHeroBlocks = activeCustomBlocks.filter(
    (id) => !CUSTOM_BLOCK_IS_HERO[id] && CUSTOM_BLOCK_PAGE[id] === "home",
  )
  const contentPageBlocks = activeCustomBlocks.filter(
    (id) => CUSTOM_BLOCK_PAGE[id] === "content",
  )

  return (
    <>
      {renderLayout(pageData[page])}

      {/* Hero replacement portal */}
      {heroPortal &&
        heroBlocks.map((id) => {
          const Block = CUSTOM_BLOCK_REGISTRY[id]
          return Block ? createPortal(<Block key={id} />, heroPortal) : null
        })}

      {/* After-hero portal (non-hero homepage blocks) */}
      {afterHeroPortal &&
        afterHeroBlocks.map((id) => {
          const Block = CUSTOM_BLOCK_REGISTRY[id]
          return Block
            ? createPortal(<Block key={id} />, afterHeroPortal)
            : null
        })}

      {/* Article layout override portal */}
      {articleHeaderPortal &&
        activeLayoutOverride === "article-alt" &&
        createPortal(
          <ArticleLayoutAlt data={articleData as ArticlePageSchemaType} />,
          articleHeaderPortal,
        )}

      {/* Content layout override portal */}
      {contentHeaderPortal &&
        activeLayoutOverride === "content-alt" &&
        createPortal(
          <ContentLayoutAlt
            title={contentData.page.title}
            summary={contentData.page.contentPageHeader?.summary ?? ""}
          />,
          contentHeaderPortal,
        )}

      {/* Content page custom blocks (appended after isomer content) */}
      {page === "content" &&
        contentPageBlocks.map((id) => {
          const Block = CUSTOM_BLOCK_REGISTRY[id]
          const label = CUSTOM_BLOCK_LABEL[id] ?? id
          return Block ? (
            <div key={id}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 48px",
                  height: 34,
                  background: "#f9fafb",
                  borderTop: "1px solid #e5e7eb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#9ca3af",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  New Block — {label}
                </span>
              </div>
              <Block />
            </div>
          ) : null
        })}
    </>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />)
