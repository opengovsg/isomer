import { BiRightArrowAlt } from "react-icons/bi"
import { tv } from "tailwind-variants"

import type { SiderailProps } from "~/interfaces"
import { useSiderailContext } from "./SiderailContext"

const createSiderailParentLabelStyles = tv({
  slots: {
    container:
      "group prose-headline-lg-semibold flex w-full items-center gap-1.5 border-b border-b-base-divider-subtle px-3 py-3.5 hover:text-brand-interaction",
    icon: "h-6 w-6 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100",
  },
})
const compoundStyles = createSiderailParentLabelStyles()

type SiderailLabelProps = Pick<SiderailProps, "parentTitle" | "parentUrl">

export const SiderailParentLabel = ({
  parentTitle,
  parentUrl,
}: SiderailLabelProps) => {
  const { LinkComponent } = useSiderailContext()

  return (
    <LinkComponent href={parentUrl} className={compoundStyles.container()}>
      {parentTitle}
      <BiRightArrowAlt aria-hidden className={compoundStyles.icon()} />
    </LinkComponent>
  )
}
