import { MdChevronRight } from "react-icons/md";

import type { BreadcrumbProps } from "~/interfaces";

const Breadcrumb = ({ links, LinkComponent = "a" }: BreadcrumbProps) => {
  return (
    <div className="flex flex-row flex-wrap gap-1">
      {links.map((link, index) => {
        const isLast = index === links.length - 1;
        return (
          <div
            key={index}
            className="flex flex-row items-center gap-1 text-content-medium"
          >
            <LinkComponent
              href={link.url}
              className="underline underline-offset-2 hover:text-hyperlink-hover active:text-hyperlink"
            >
              {link.title}
            </LinkComponent>
            {!isLast && <MdChevronRight className="h-auto min-w-6" />}
          </div>
        );
      })}
    </div>
  );
};

export default Breadcrumb;
