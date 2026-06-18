import type { HomePageSchemaType } from "@opengovsg/isomer-components"
import { renderLayout } from "@opengovsg/isomer-components/templates/next"
import { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import { articleData } from "./data/article"
import { contentData } from "./data/content"
import { homeData } from "./data/home"
import { SITE_HOME_DATA } from "./data/sites"

type PageType = "home" | "article" | "content"

function applyThemeVars(vars: Record<string, string>) {
  const root = document.documentElement
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v)
  }
}

function App() {
  const initial = (new URLSearchParams(window.location.search).get(
    "page",
  ) as PageType) || "home"
  const [page, setPage] = useState<PageType>(initial)
  const [homePage, setHomePage] = useState<HomePageSchemaType>(homeData)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data) return
      if (e.data.type === "theme") applyThemeVars(e.data.vars)
      if (e.data.type === "page") setPage(e.data.page as PageType)
      if (e.data.type === "sitePreset") {
        const preset = SITE_HOME_DATA[e.data.preset as keyof typeof SITE_HOME_DATA]
        if (preset) setHomePage(preset)
      }
      if (e.data.type === "fonts") {
        document.documentElement.style.setProperty(
          "--font-heading",
          e.data.heading,
        )
        document.documentElement.style.setProperty("--font-body", e.data.body)
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  const pageData = { home: homePage, article: articleData, content: contentData }
  return <>{renderLayout(pageData[page])}</>
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />)
