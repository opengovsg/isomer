import { BiRightArrowAlt } from "react-icons/bi"

import type { Item } from "./types"
import { tv } from "~/lib/tv"
import { useSiderailContext } from "./SiderailContext"

const createSiderailLabelStyles = tv({
  slots: {
    container:
      "group prose-body-base flex w-full flex-row justify-between gap-2 px-3 py-4 transition hover:text-brand-interaction",
    icon: "-mr-2 h-6 w-6 shrink-0 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100",
  },
  variants: {
    isCurrent: {
      true: {
        container:
          "prose-headline-base-semibold cursor-default hover:text-inherit",
      },
    },
  },
})

const compoundStyles = createSiderailLabelStyles()

interface SiderailLabelProps extends Omit<Item, "childPages"> {
  className?: string
  showIconOnHover?: boolean
}

export const SiderailLabel = ({
  isCurrent,
  title,
  url,
  className,
  showIconOnHover,
}: SiderailLabelProps) => {
  const { LinkComponent } = useSiderailContext()
  if (isCurrent) {
    return (
      <p className={compoundStyles.container({ className, isCurrent })}>
        {title}
      </p>
    )
  }

  return (
    <LinkComponent
      href={url}
      className={compoundStyles.container({ className })}
    >
      {title}

      {showIconOnHover && (
        <BiRightArrowAlt aria-hidden className={compoundStyles.icon()} />
      )}
    </LinkComponent>
  )
}
