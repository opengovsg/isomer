import { useCallback, useEffect, useRef, useState } from "react"

import type { ImageFit, RowDef } from "./registry"
import { GROUPS } from "./registry"
import { DEFAULT_IMAGE_KEY, TEST_IMAGES } from "./testImages"

const DEVICES = [
  { key: "mobile", label: "Mobile", width: 390 },
  { key: "tablet", label: "Tablet", width: 768 },
  { key: "desktop", label: "Desktop", width: 1280 },
] as const

type DeviceKey = (typeof DEVICES)[number]["key"]

/** One iframe at a true device width, uniformly scaled down to fit its slot. */
const DevicePane = ({
  row,
  device,
  imgKey,
  fit,
}: {
  row: RowDef
  device: (typeof DEVICES)[number]
  imgKey: string
  fit: ImageFit
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const [frameHeight, setFrameHeight] = useState(300)
  const [scale, setScale] = useState(1)

  // Scale = slot width / device width (never enlarge).
  useEffect(() => {
    const slot = slotRef.current
    if (!slot) return
    const update = () => setScale(Math.min(1, slot.clientWidth / device.width))
    const ro = new ResizeObserver(update)
    ro.observe(slot)
    update()
    return () => ro.disconnect()
  }, [device.width])

  // Listen for height reports from this pane's own iframe.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return
      const data = e.data as { type?: string; height?: number }
      if (data.type === "audit:height" && typeof data.height === "number") {
        setFrameHeight(Math.max(60, data.height))
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  // Push current state whenever it changes (and on load, via key on src).
  const pushState = useCallback(() => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    win.postMessage({ type: "audit:set-image", img: imgKey }, "*")
    win.postMessage({ type: "audit:set-fit", fit }, "*")
  }, [imgKey, fit])

  useEffect(pushState, [pushState])

  const src = `/?frame=${row.id}&img=${imgKey}&fit=${fit}`

  return (
    <div className="pane">
      <div className="pane-label">
        {device.label} · {device.width}px
        {scale < 0.995 && (
          <span className="pane-scale">
            {" "}
            (shown at {Math.round(scale * 100)}%)
          </span>
        )}
      </div>
      <div className="pane-slot" ref={slotRef}>
        <div
          className="pane-clip"
          style={{ height: frameHeight * scale, width: device.width * scale }}
        >
          <iframe
            ref={iframeRef}
            title={`${row.name} at ${device.width}px`}
            src={src}
            onLoad={pushState}
            style={{
              width: device.width,
              height: frameHeight,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              border: "0",
            }}
          />
        </div>
      </div>
    </div>
  )
}

const Row = ({ row, imgKey }: { row: RowDef; imgKey: string }) => {
  const [fit, setFit] = useState<ImageFit>("cover")

  return (
    <section className="row" id={row.id}>
      <header className="row-head">
        <div className="row-title-line">
          <h3>{row.name}</h3>
          <a href={row.storybook} target="_blank" rel="noreferrer">
            Storybook ↗
          </a>
        </div>
        <p className="row-note">{row.note}</p>
        <div className="row-controls">
          {row.hasFitControl && (
            <div
              className="fit-control"
              role="radiogroup"
              aria-label="Image display (editor control)"
            >
              <span>Image display (editor control):</span>
              {(["cover", "contain"] as const).map((f) => (
                <label key={f}>
                  <input
                    type="radio"
                    name={`fit-${row.id}`}
                    checked={fit === f}
                    onChange={() => setFit(f)}
                  />
                  {f === "cover"
                    ? "Default (cover)"
                    : "Resize to fit (contain)"}
                </label>
              ))}
            </div>
          )}
          {row.pickerDoesNotApply && (
            <p className="picker-na">
              Thumbnail is auto-fetched — the image picker does not apply here.
            </p>
          )}
        </div>
      </header>
      <div className="panes">
        {DEVICES.map((d) => (
          <div
            key={d.key}
            className={`pane-area pane-area-${d.key as DeviceKey}`}
          >
            <DevicePane row={row} device={d} imgKey={imgKey} fit={fit} />
          </div>
        ))}
      </div>
    </section>
  )
}

export const Shell = () => {
  const [groupId, setGroupId] = useState(GROUPS[0]!.id)
  const [imgKey, setImgKey] = useState(DEFAULT_IMAGE_KEY)

  const group = GROUPS.find((g) => g.id === groupId) ?? GROUPS[0]!

  return (
    <div className="shell">
      <header className="shell-head">
        <div>
          <h1>Isomer Image Audit Playground</h1>
          <p>
            Every image-bearing NEXT component, rendered unmodified from{" "}
            <code>packages/components/src</code> at three real viewport widths.
            Pick a test image — every preview updates.
          </p>
        </div>
        <div className="picker" role="radiogroup" aria-label="Test image">
          {TEST_IMAGES.map((img) => (
            <button
              key={img.key}
              className={`picker-item ${img.key === imgKey ? "active" : ""}`}
              onClick={() => setImgKey(img.key)}
              aria-pressed={img.key === imgKey}
            >
              <span className="picker-thumb">
                <img src={img.src} alt="" />
              </span>
              <span className="picker-label">{img.label}</span>
              <span className="picker-dims">
                {img.w} × {img.h}
              </span>
            </button>
          ))}
        </div>
      </header>

      <nav className="tabs" role="tablist">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            role="tab"
            aria-selected={g.id === groupId}
            className={g.id === groupId ? "active" : ""}
            onClick={() => setGroupId(g.id)}
          >
            {g.title}
            <span className="tab-count">{g.rows.length}</span>
          </button>
        ))}
      </nav>

      <main>
        {group.rows.map((row) => (
          <Row key={`${group.id}-${row.id}`} row={row} imgKey={imgKey} />
        ))}
      </main>
    </div>
  )
}
