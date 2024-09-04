import type { CSSProperties, PropsWithChildren } from "react"
import root from "react-shadow"

interface PreviewShadowDomProps extends PropsWithChildren {
  preventPointerEvents?: boolean
  keyForRerender?: string
  style?: CSSProperties
}

export const PreviewShadowDom = ({
  children,
  style,
  keyForRerender,
  preventPointerEvents,
}: PreviewShadowDomProps) => {
  return (
    // @ts-expect-error react-shadow types are not compatible with strict.
    <root.div style={style}>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        type="text/css"
        href="/assets/css/preview-tw.css"
      />
      <div
        key={keyForRerender}
        // Allows all fixed positions to be relative to the shadow host
        // No freaking clue why it works but it does
        // https://stackoverflow.com/a/70422489
        style={{
          transform: "scale(1)",
          pointerEvents: preventPointerEvents ? "none" : undefined,
        }}
      >
        {children}
      </div>
    </root.div>
  )
}
