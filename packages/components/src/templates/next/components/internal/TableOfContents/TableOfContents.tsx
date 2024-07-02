import { BiRightArrowAlt } from "react-icons/bi";

import type { TableOfContentsProps } from "~/interfaces";

const TableOfContents = ({ items }: TableOfContentsProps) => {
  return (
    <div className="flex flex-col gap-3 border-l-4 border-content pl-5">
      <p className="text-lg font-semibold text-content-strong">On this page</p>
      <div className="flex flex-col gap-3">
        {items.map(({ anchorLink, content }) => (
          <div className="flex flex-row items-start gap-2">
            <BiRightArrowAlt className="size-6 shrink-0 text-interaction-main" />
            <a
              href={anchorLink}
              className="w-fit text-hyperlink underline underline-offset-2 hover:text-hyperlink-hover active:text-hyperlink"
            >
              {content}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableOfContents;
