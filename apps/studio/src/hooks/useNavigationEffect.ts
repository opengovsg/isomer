import { useEffect } from "react"
import { useRouter } from "next/router"

interface UseNavigationEffectProps {
  isOpen?: boolean
  isDirty?: boolean
  callback: (url: string) => void
}
export const useNavigationEffect = ({
  isOpen,
  isDirty,
  callback,
}: UseNavigationEffectProps) => {
  const router = useRouter()

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (isDirty) {
        router.events.off("routeChangeStart", handleRouteChange)
        callback(url)
        router.events.emit("routeChangeError")
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw "Error to abort router route change. Ignore this!"
      }
    }

    if (!isOpen) {
      router.events.on("routeChangeStart", handleRouteChange)
    }
    return () => {
      router.events.off("routeChangeStart", handleRouteChange)
    }
  }, [isOpen, router.events, isDirty])
}
