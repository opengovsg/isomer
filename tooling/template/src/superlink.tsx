"use client"

import { type ComponentPropsWithRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export const SuperLink = (props: ComponentPropsWithRef<typeof Link>) => {
  const router = useRouter()
  const strHref = typeof props.href === "string" ? props.href : props.href.href

  const conditionalPrefetch = () => {
    if (strHref) {
      void router.prefetch(strHref)
    }
  }

  return (
    <Link
      {...props}
      prefetch={false}
      onMouseEnter={(e) => {
        conditionalPrefetch()
        return props.onMouseEnter?.(e)
      }}
      onPointerEnter={(e) => {
        conditionalPrefetch()
        return props.onPointerEnter?.(e)
      }}
      onTouchStart={(e) => {
        conditionalPrefetch()
        return props.onTouchStart?.(e)
      }}
      onFocus={(e) => {
        conditionalPrefetch()
        return props.onFocus?.(e)
      }}
    />
  )
}
