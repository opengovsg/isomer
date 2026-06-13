import type { LocalSearchProps } from "~/interfaces"
import { BiSearch } from "react-icons/bi"
import { twMerge } from "~/lib/twMerge"

export const LocalSearchInputBox = ({
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
        className="border-divider-medium focus:border-site-primary focus:ring-site-primary block w-full border px-4 py-2 focus:outline-0"
      />

      <button
        type="submit"
        aria-label="Search this site"
        className="cursor-pointer"
      >
        <BiSearch className="mt-0.5 text-3xl" />
      </button>
    </form>
  )
}
