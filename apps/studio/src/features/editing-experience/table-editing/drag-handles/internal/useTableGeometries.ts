import type { Editor as TiptapEditor } from "@tiptap/react"
import type { RefObject } from "react"
import { useLayoutEffect, useState } from "react"

import type { TableGeometry } from "./axisMath"
import {
  findAllTables,
  measureTableGeometry,
  reconcileGeometries,
} from "./measure"

const EMPTY_GEOMETRIES: TableGeometry[] = []

/** Row and column rects for every table, updated on edit, scroll, and resize. */
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
      setGeometries((previous) => reconcileGeometries(previous, next))
    }

    const resizeObserver = new ResizeObserver(measure)

    const observeLayout = () => {
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
    // `transaction` also covers document updates.
    editor.on("transaction", onEditorChange)
    window.addEventListener("resize", measure)
    const container = containerRef.current
    container?.addEventListener("scroll", measure, true)

    return () => {
      cancelAnimationFrame(raf)
      editor.off("transaction", onEditorChange)
      window.removeEventListener("resize", measure)
      container?.removeEventListener("scroll", measure, true)
      resizeObserver.disconnect()
    }
  }, [editor, containerRef])

  return geometries
}
