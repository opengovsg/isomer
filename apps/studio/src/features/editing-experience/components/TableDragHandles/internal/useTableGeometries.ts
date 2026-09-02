import type { Editor as TiptapEditor } from "@tiptap/react"
import type { RefObject } from "react"
import { useLayoutEffect, useState } from "react"

import type { TableGeometry } from "./axisMath"
import { findAllTables, geometriesEqual, measureTableGeometry } from "./measure"

const EMPTY_GEOMETRIES: TableGeometry[] = []

/**
 * Row and column rects for every table in the document, in container
 * coordinates, kept in step with editing, scrolling and layout changes.
 */
export const useTableGeometries = (
  editor: TiptapEditor | null,
  containerRef: RefObject<HTMLElement>,
): TableGeometry[] => {
  const [geometries, setGeometries] =
    useState<TableGeometry[]>(EMPTY_GEOMETRIES)

  useLayoutEffect(() => {
    if (!editor) {
      setGeometries(EMPTY_GEOMETRIES)
      return
    }

    const measure = () => {
      const container = containerRef.current
      if (!container) {
        setGeometries(EMPTY_GEOMETRIES)
        return
      }
      const containerRect = container.getBoundingClientRect()
      const next = findAllTables(editor).map((table) =>
        measureTableGeometry(editor, table, container, containerRect),
      )
      // Keep the previous array when nothing moved: handles stay mounted and
      // consumers keyed on the geometry identity do not re-subscribe.
      setGeometries((previous) =>
        geometriesEqual(previous, next) ? previous : next,
      )
    }

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null

    const observeLayout = () => {
      if (!resizeObserver) return
      resizeObserver.disconnect()
      const container = containerRef.current
      if (!container) return
      resizeObserver.observe(container)
      container.querySelectorAll("table").forEach((table) => {
        resizeObserver.observe(table)
      })
    }

    const onEditorChange = () => {
      observeLayout()
      measure()
    }

    measure()
    observeLayout()
    const raf = requestAnimationFrame(onEditorChange)
    // `transaction` covers document updates too, so one listener is enough.
    editor.on("transaction", onEditorChange)
    window.addEventListener("resize", measure)
    const container = containerRef.current
    container?.addEventListener("scroll", measure, true)

    return () => {
      cancelAnimationFrame(raf)
      editor.off("transaction", onEditorChange)
      window.removeEventListener("resize", measure)
      container?.removeEventListener("scroll", measure, true)
      resizeObserver?.disconnect()
    }
  }, [editor, containerRef])

  return geometries
}
