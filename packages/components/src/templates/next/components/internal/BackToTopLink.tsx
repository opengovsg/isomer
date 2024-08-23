import { BiUpArrowAlt } from "react-icons/bi"

import { Link } from "./Link"

export const BackToTopLink = (): JSX.Element => {
  return (
    <Link
      href="#"
      // TODO: Replace LinkComponent with a custom link component with all the styles
      className="prose-body-base sticky top-8 my-8 flex items-center text-link underline-offset-4 hover:underline"
    >
      <BiUpArrowAlt aria-hidden className="h-6 w-6" />
      Back to top
    </Link>
  )
}
