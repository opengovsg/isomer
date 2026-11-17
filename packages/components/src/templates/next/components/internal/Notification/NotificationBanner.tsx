import type { NotificationClientProps } from "~/interfaces"
import { BiInfoCircle, BiX } from "react-icons/bi"

import { IconButton } from "../IconButton"

interface NotificationBannerProps extends NotificationClientProps {
  // Given by client components (CentralNotification). Without it the banner is static HTML and
  // dismissal is handled by the host page: the button and banner carry data-isomer-notification*
  // hooks, and sessionStorage["notification-dismissed"] = "true" means dismissed.
  onDismiss?: () => void
}

// IconButton's look, with CSS :focus-visible instead of react-aria (no JS needed).
const staticDismissButtonClassName =
  "box-border flex h-12 w-12 cursor-pointer items-center justify-center rounded bg-transparent p-2 text-center text-base-content outline outline-0 outline-offset-2 outline-link transition hover:bg-base-canvas-backdrop/50 focus-visible:bg-utility-highlight focus-visible:text-base-content-strong focus-visible:outline-2 focus-visible:transition-none active:bg-base-canvas-backdrop/80"

export const NotificationBanner = ({
  title,
  children,
  onDismiss,
}: NotificationBannerProps) => {
  return (
    <div
      className="bg-utility-feedback-info-faint"
      data-isomer-notification={onDismiss ? undefined : ""}
    >
      <div className="relative mx-auto flex max-w-screen-xl flex-row gap-4 px-6 py-4 text-base-content md:px-10 md:py-4">
        <div className="flex flex-row gap-2">
          <BiInfoCircle className="mt-[3px] h-4 w-4 shrink-0" />
          <div className="flex flex-1 flex-col gap-0.5">
            {!!title && (
              // Not a heading: Notification always renders above the
              // page's h1 (it's site-wide chrome via Skeleton), so a real
              // heading tag here would sit before any h1 in DOM order.
              <div className="prose-headline-base-medium">{title}</div>
            )}
            <div className="[&_p]:!mb-0 [&_p]:!mt-0">{children}</div>
          </div>
        </div>
        <div aria-hidden className="flex h-6 w-6 shrink-0" />
        {onDismiss ? (
          <IconButton
            onPress={onDismiss}
            icon={BiX}
            className="absolute right-3 top-1 md:right-7"
            aria-label="Dismiss notification temporarily"
          />
        ) : (
          <button
            type="button"
            data-isomer-notification-dismiss=""
            className={`${staticDismissButtonClassName} absolute right-3 top-1 md:right-7`}
            aria-label="Dismiss notification temporarily"
          >
            <BiX className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  )
}
