import { BiSearch } from "react-icons/bi";

import type { LocalSearchInputBoxProps } from "~/interfaces";

const LocalSearchInputBox = ({
  searchUrl,
}: Omit<LocalSearchInputBoxProps, "type">) => {
  return (
    <form action={searchUrl} method="get" className="flex flex-row gap-2">
      <input
        type="search"
        name="q"
        placeholder="Search this site"
        className="border-divider-medium focus:border-site-primary focus:ring-site-primary block w-full border px-4 py-2 focus:outline-none"
      />

      <button type="submit" aria-label="Search this site">
        <BiSearch className="mt-0.5 text-2xl" />
      </button>
    </form>
  );
};

export default LocalSearchInputBox;
