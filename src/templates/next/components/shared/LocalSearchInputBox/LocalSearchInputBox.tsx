import { BiSearch } from "react-icons/bi"
import LocalSearchInputBoxProps from "~/common/LocalSearchInputBox"

const LocalSearchInputBox = ({ searchUrl }: LocalSearchInputBoxProps) => {
  return (
    <form action={searchUrl} method="get" className="flex flex-row gap-2">
      <input
        type="search"
        name="q"
        placeholder="Search this site"
        className="block w-full px-4 py-2 border border-divider-medium focus:border-site-primary focus:ring-site-primary focus:outline-none"
      />

      <button type="submit" aria-label="Search this site">
        <BiSearch className="text-2xl mt-0.5" />
      </button>
    </form>
  )
}

export default LocalSearchInputBox
