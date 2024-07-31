import { BiRightArrowAlt } from "react-icons/bi"
import { tv } from "tailwind-variants"

import type { Item } from "./types"
import { useSiderailContext } from "./SiderailContext"

const createSiderailLabelStyles = tv({
  slots: {
    container: "group px-3 py-4 transition hover:text-brand-interaction",
    icon: "-mt-0.5 inline h-6 w-6 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100",
  },
  variants: {
    isCurrent: {
      true: {
        container: "text-brand-interaction",
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
