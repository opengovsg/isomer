import { useContext } from "react"
import { BlockConfigContext } from "../BlockConfigContext"

const IMAGE_URL = "https://picsum.photos/seed/isomer-focal/1200/800"

export default function ImageManipulation() {
  const { configs } = useContext(BlockConfigContext)
  const cfg = configs["image-manipulation"] ?? {}

  const fitting = (cfg.fitting as string) ?? "cover"
  const focalPoint = (cfg.focalPoint as string) ?? "center center"
  const dimensions = (cfg.dimensions as string) ?? "landscape"

  const aspectRatio = dimensions === "portrait" ? "3 / 4" : "16 / 9"

  return (
    <div className="component-content my-8">
      <div
        style={{
          width: "100%",
          aspectRatio,
          overflow: "hidden",
          borderRadius: 8,
          background: "#e5e7eb",
        }}
      >
        <img
          src={IMAGE_URL}
          alt="Image manipulation demo"
          style={{
            width: "100%",
            height: "100%",
            objectFit: fitting as "cover" | "contain",
            objectPosition: focalPoint,
            display: "block",
          }}
        />
      </div>
    </div>
  )
}
