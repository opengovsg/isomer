import { renderLayout } from "@opengovsg/isomer-components/templates/next"
import { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import { articleData } from "./data/article"
import { contentData } from "./data/content"
import { homeData } from "./data/home"

type PageType = "home" | "article" | "content"

const PAGE_DATA = {
  home: homeData,
  article: articleData,
  content: contentData,
}

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

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data) return
      if (e.data.type === "theme") applyThemeVars(e.data.vars)
      if (e.data.type === "page") setPage(e.data.page as PageType)
      if (e.data.type === "font") {
        document.documentElement.style.setProperty(
          "--font-family",
          e.data.value,
        )
        document.documentElement.style.fontFamily = e.data.value
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  return <>{renderLayout(PAGE_DATA[page])}</>
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />)
