import React from "react"
import ReactDOM from "react-dom/client"

import Editor from "./components/Editor/Editor.tsx"
import "./styles.css"

const rootElement = document.getElementById("root")
if (rootElement === null) {
  throw new Error("Could not find root element")
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Editor />
  </React.StrictMode>,
)
