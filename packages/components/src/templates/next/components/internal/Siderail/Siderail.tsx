"use client";

import { useState } from "react";
import { BiLeftArrowAlt } from "react-icons/bi";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";

import type { SiderailProps } from "~/interfaces";

const SiderailMobile = ({
  parentTitle,
  pages,
  LinkComponent = "a",
}: Omit<SiderailProps, "type">) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="relative lg:hidden">
      <button
        className="flex w-full items-center justify-between gap-2 border-b-2 border-black px-5 py-4"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={`${
          isExpanded ? "Collapse" : "Expand"
        } local navigation menu`}
      >
        <h4 className="text-content-strong text-heading-04-medium">
          {parentTitle}
        </h4>
        {isExpanded ? (
          <MdKeyboardArrowUp className="h-auto w-6 flex-shrink-0" />
        ) : (
          <MdKeyboardArrowDown className="h-auto w-6 flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <ul className="absolute w-full bg-white">
          {pages.map(({ url, title, isCurrent, childPages }) => {
            return (
              <li
                className="border-b border-divider-medium text-content text-paragraph-03"
                aria-current={isCurrent ? "page" : undefined}
              >
                {isCurrent ? (
                  <p className="block px-5 py-4 font-bold">{title}</p>
                ) : (
                  <LinkComponent
                    href={url}
                    className="block px-5 py-4 hover:bg-interaction-sub active:underline active:underline-offset-2"
                  >
                    {title}
                  </LinkComponent>
                )}
                {isCurrent && (
                  <ul>
                    {childPages?.map(({ title, url }, index) => {
                      return (
                        <li>
                          <LinkComponent
                            href={url}
                            className={`block py-3 pl-12 pr-5 hover:bg-interaction-sub active:underline active:underline-offset-2 ${
                              index === childPages.length - 1 && "pb-4"
                            }`}
                          >
                            {title}
                          </LinkComponent>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const SiderailDesktop = ({
  parentTitle,
  parentUrl,
  pages,
  LinkComponent = "a",
}: Omit<SiderailProps, "type">) => {
  return (
    <div className="hidden w-full flex-col lg:flex">
      <LinkComponent
        href={parentUrl}
        className="flex items-start gap-2 border-b-2 border-black pb-2"
      >
        <BiLeftArrowAlt className="h-9 w-6 flex-shrink-0" />
        <h4 className="text-content-strong text-heading-04-medium">
          {parentTitle}
        </h4>
      </LinkComponent>

      <ul>
        {pages.map(({ url, title, isCurrent, childPages }, index) => {
          return (
            <li
              className={`text-paragraph-03 ${
                index !== pages.length - 1 && "border-b border-divider-medium"
              } text-content`}
              aria-current={isCurrent ? "page" : undefined}
            >
              {isCurrent ? (
                <p className="block px-2 py-3 font-bold">{title}</p>
              ) : (
                <LinkComponent
                  href={url}
                  className="block px-2 py-3 hover:bg-interaction-sub active:underline active:underline-offset-2"
                >
                  <p className="">{title}</p>
                </LinkComponent>
              )}
              {isCurrent && (
                <ul>
                  {childPages?.map(({ url, title }, index) => {
                    return (
                      <li>
                        <LinkComponent
                          href={url}
                          className={`block py-2.5 pl-10 pr-2 hover:bg-interaction-sub active:underline active:underline-offset-2 ${
                            index === childPages.length - 1 && "pb-3"
                          }`}
                        >
                          {title}
                        </LinkComponent>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export const Siderail = (props: SiderailProps) => {
  return (
    <>
      <SiderailMobile {...props} />
      <SiderailDesktop {...props} />
    </>
  );
};

export default Siderail;
