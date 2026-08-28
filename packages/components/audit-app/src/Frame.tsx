import { useEffect, useRef, useState } from "react"

import type { ImageFit } from "./registry"
import { findRow } from "./registry"
import { getTestImage } from "./testImages"

/**
 * Frame mode: renders exactly one registry row full-bleed inside an iframe,
 * so Tailwind's viewport media queries respond to the iframe's own width.
 * State arrives via URL params (initial) and postMessage (live updates).
 */
export const Frame = () => {
  const params = new URLSearchParams(window.location.search)
  const rowId = params.get("frame") ?? ""
  const [imgKey, setImgKey] = useState(params.get("img"))
  const [fit, setFit] = useState<ImageFit>(
    params.get("fit") === "contain" ? "contain" : "cover",
  )
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string; img?: string; fit?: ImageFit }
      if (data.type === "audit:set-image" && data.img) setImgKey(data.img)
      if (data.type === "audit:set-fit" && data.fit) setFit(data.fit)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  // Report rendered height to the shell so panes can auto-size.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const report = () => {
      window.parent.postMessage(
        { type: "audit:height", height: el.scrollHeight },
        "*",
      )
    }
    const ro = new ResizeObserver(report)
    ro.observe(el)
    report()
    const t = window.setInterval(report, 1000) // lazy images can change height without resizing `el`'s observed box
    return () => {
      ro.disconnect()
      window.clearInterval(t)
    }
  }, [])

  const row = findRow(rowId)
  if (!row) {
    return <div style={{ padding: 16 }}>Unknown component: {rowId}</div>
  }

  return (
    <div ref={rootRef}>
      <row.Render img={getTestImage(imgKey)} fit={fit} />
    </div>
  )
}
