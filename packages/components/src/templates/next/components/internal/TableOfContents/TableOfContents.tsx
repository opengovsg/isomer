import { BiRightArrowAlt } from "react-icons/bi";

import type { TableOfContentsProps } from "~/interfaces";

const TableOfContents = ({ items }: TableOfContentsProps) => {
  return (
    <div className="border-content flex flex-col gap-3 border-l-4 pl-5">
      <p className="text-content-strong text-lg font-semibold">On this page</p>
      <div className="flex flex-col gap-3">
        {items.map(({ anchorLink, content }) => (
          <div className="flex flex-row items-start gap-2">
            <BiRightArrowAlt className="text-interaction-main size-6 shrink-0" />
            <a
              href={anchorLink}
              className="text-hyperlink hover:text-hyperlink-hover active:text-hyperlink w-fit underline underline-offset-2"
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
