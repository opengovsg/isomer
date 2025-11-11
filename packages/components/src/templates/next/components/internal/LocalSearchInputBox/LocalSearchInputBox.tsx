import { BiSearch } from "react-icons/bi"

import type { LocalSearchProps } from "~/interfaces"
import { twMerge } from "~/lib/twMerge"

const LocalSearchInputBox = ({
  searchUrl,
  className,
}: Omit<LocalSearchProps, "type">) => {
  return (
    <form
      action={searchUrl}
      method="get"
      className={twMerge("flex h-[3.25rem] flex-row gap-3 lg:h-16", className)}
    >
      <input
        type="search"
        name="q"
        placeholder="Search this site"
        className="block w-full border border-divider-medium px-4 py-2 focus:border-site-primary focus:outline-none focus:ring-site-primary"
      />

      <button type="submit" aria-label="Search this site">
        <BiSearch className="mt-0.5 text-3xl" />
      </button>
    </form>
  )
}

export default LocalSearchInputBox
