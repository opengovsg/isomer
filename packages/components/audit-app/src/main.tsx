import React from "react"
import ReactDOM from "react-dom/client"
// The real template stylesheet — Tailwind + Isomer Next theme tokens,
// identical to what the package's Storybook loads. Zero styling changes.
import "~/index.css"

import { Frame } from "./Frame"
import { Shell } from "./Shell"
import "./shell.css"

const isFrame = new URLSearchParams(window.location.search).has("frame")

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>{isFrame ? <Frame /> : <Shell />}</React.StrictMode>,
)
