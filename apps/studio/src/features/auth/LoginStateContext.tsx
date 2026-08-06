import type { PropsWithChildren } from "react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react"
import { LOGGED_IN_KEY } from "~/constants/localStorage"
import { useLocalStorage } from "~/hooks/useLocalStorage"
import { withPosthog } from "~/lib/posthog"
import { trpc } from "~/utils/trpc"

interface LoginStateContextReturn {
  hasLoginStateFlag?: boolean
  setHasLoginStateFlag: () => void
  removeLoginStateFlag: () => void
}

// Exported for testing.
export const LoginStateContext = createContext<LoginStateContextReturn | null>(
  null,
)

/**
 * Provider component that wraps your app and makes client login state boolean available
 * to any child component that calls `useLoginState()`.
 */
export const LoginStateProvider = ({ children }: PropsWithChildren) => {
  const loginState = useProvideLoginState()

  return (
    <LoginStateContext.Provider value={loginState}>
      <PostHogIdentity />
      {children}
    </LoginStateContext.Provider>
  )
}

/**
 * Hook for components nested in LoginStateProvider component to get the current login state.
 */
export const useLoginState = (): LoginStateContextReturn => {
  const context = useContext(LoginStateContext)
  if (!context) {
    throw new Error(
      `useLoginState must be used within a LoginStateProvider component`,
    )
  }
  return context
}

const PostHogIdentity = () => {
  const { hasLoginStateFlag } = useLoginState()
  const { data: user } = trpc.me.get.useQuery(undefined, {
    enabled: hasLoginStateFlag,
  })
  // Site-wide (siteId, role) pairs for cohorting users in PostHog by the
  // permissions they hold — see `site.list` for how roles are resolved.
  const { data: sites } = trpc.site.list.useQuery(undefined, {
    enabled: hasLoginStateFlag,
  })
  const identifiedUserId = useRef<string | undefined>(undefined)

  useEffect(() => {
    // Logout resets PostHog's identity independently (see useMe's `logout`),
    // so clear our own guard too — otherwise a same-user relogin sees
    // `identifiedUserId.current` still set and skips re-identifying,
    // leaving subsequent events anonymous.
    if (!hasLoginStateFlag) {
      identifiedUserId.current = undefined
      return
    }

    if (!user || !sites || identifiedUserId.current === user.id) return

    void withPosthog((posthog) => {
      if (identifiedUserId.current && identifiedUserId.current !== user.id) {
        posthog.reset()
      }

      posthog.identify(user.id, {
        email: user.email,
        ...(user.name ? { name: user.name } : {}),
        site_roles: sites.map((site) => `${site.id}:${site.role}`),
      })
      identifiedUserId.current = user.id
    })
  }, [user, sites, hasLoginStateFlag])

  return null
}

const useProvideLoginState = () => {
  const [hasLoginStateFlag, setLoginStateFlag] = useLocalStorage<boolean>(
    LOGGED_IN_KEY,
    undefined,
  )

  const setHasLoginStateFlag = useCallback(() => {
    setLoginStateFlag(true)
  }, [setLoginStateFlag])

  const removeLoginStateFlag = useCallback(() => {
    setLoginStateFlag(undefined)
  }, [setLoginStateFlag])

  return {
    hasLoginStateFlag: !!hasLoginStateFlag,
    setHasLoginStateFlag,
    removeLoginStateFlag,
  }
}
