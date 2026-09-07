/* oxlint-disable typescript/promise-function-async -- studio lint cleanup */
import type { ComponentProps } from "react"
import { useRouter } from "next/router"
import { Suspense as ReactSuspense } from "react"

const Suspense = (props: ComponentProps<typeof ReactSuspense>) => {
  const router = useRouter()

  // Wait until the router is ready so suspense queries do not fire twice with
  // undefined params before the actual route values are available.
  if (!router.isReady) {
    return props.fallback
  }

  return <ReactSuspense {...props} />
}

export default Suspense
