import { BiRightArrowAlt } from "react-icons/bi"
import { tv } from "tailwind-variants"

import type { SiderailProps } from "~/interfaces"
import { useSiderailContext } from "./SiderailContext"

const createSiderailParentLabelStyles = tv({
  slots: {
    container: "border-b border-b-base-divider-subtle px-3 py-3.5",
    label:
      "group prose-headline-lg-semibold w-full hover:text-brand-interaction",
    icon: "-mt-0.5 inline h-6 w-6 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100",
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
    <li className={compoundStyles.container()}>
      <LinkComponent href={parentUrl} className={compoundStyles.label()}>
        {parentTitle}
        <BiRightArrowAlt aria-hidden className={compoundStyles.icon()} />
      </LinkComponent>
    </li>
  )
}
