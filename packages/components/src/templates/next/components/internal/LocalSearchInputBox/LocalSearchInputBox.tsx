import { BiSearch } from "react-icons/bi"

import type { LocalSearchProps } from "~/interfaces"

const LocalSearchInputBox = ({ searchUrl }: Omit<LocalSearchProps, "type">) => {
  return (
    <form action={searchUrl} method="get" className="flex flex-row gap-2">
      <input
        type="search"
        name="q"
        placeholder="Search this site"
        className="block w-full border border-divider-medium px-4 py-2 focus:border-site-primary focus:outline-none focus:ring-site-primary"
      />

      <button type="submit" aria-label="Search this site">
        <BiSearch className="mt-0.5 text-2xl" />
      </button>
    </form>
  )
}

export default LocalSearchInputBox
