"use client"

import { useEffect, useRef, useState } from "react"
import { BiLinkExternal } from "react-icons/bi"

import { collectionCardLinkStyle } from "./collectionCardLinkStyle"

// This is needed because we want the external link icon to always be visible
// When title is not truncated, we show the external link icon at the end of the title
// When title is truncated, we show the external link icon below the title in a new line
export const ExternalLinkTitle = ({ title }: { title: string }) => {
  const textRef = useRef<HTMLSpanElement | null>(null)

  const [isTruncated, setIsTruncated] = useState(false)

  useEffect(() => {
    const checkTruncation = () => {
      const element = textRef.current
      if (!element) return

      setIsTruncated(element.scrollHeight > element.clientHeight)
    }

    checkTruncation()

    window.addEventListener("resize", checkTruncation)
    return () => window.removeEventListener("resize", checkTruncation)
  }, [title])

  return (
    <h3 className={collectionCardLinkStyle()}>
      <span ref={textRef} className="line-clamp-3" title={title}>
        {title}
        {!isTruncated && (
          <BiLinkExternal className="ml-1 inline-block h-auto w-3.5 align-middle lg:ml-1.5 lg:w-4" />
        )}
      </span>

      {/* Show icon below text if truncated */}
      {isTruncated && (
        <div className="mt-1">
          <BiLinkExternal className="h-auto w-3.5 text-base-content-subtle lg:w-4" />
        </div>
      )}
    </h3>
  )
}
