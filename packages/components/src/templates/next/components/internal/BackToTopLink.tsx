import type { VariantProps } from "tailwind-variants"
import { BiUpArrowAlt } from "react-icons/bi"

import { tv } from "~/lib/tv"
import { Link } from "./Link"

const styles = tv({
  base: "prose-body-base sticky top-8 my-8 flex items-center text-link underline-offset-4 hover:underline",
})

interface BackToTopLinkProps extends VariantProps<typeof styles> {
  className?: string
}

export const BackToTopLink = ({
  className,
}: BackToTopLinkProps): JSX.Element => {
  return (
    <Link href="#" className={styles({ className })}>
      <BiUpArrowAlt aria-hidden className="h-6 w-6" />
      Back to top
    </Link>
  )
}
