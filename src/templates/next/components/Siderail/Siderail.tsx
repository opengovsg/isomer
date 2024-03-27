import { BiLeftArrowAlt } from "react-icons/bi"
import { SiderailProps } from "~/common"
import { Heading } from "../../typography/Heading"
import { Paragraph } from "../../typography/Paragraph"
import { useState } from "react"
import { MdKeyboardArrowUp, MdKeyboardArrowDown } from "react-icons/md"

const SiderailMobile = ({
  parentTitle,
  pages,
  LinkComponent = "a",
}: Omit<SiderailProps, "type">) => {
  const [isExpanded, setIsExpanded] = useState(false)
  return (
    <div className="lg:hidden">
      <button
        className="w-full flex gap-2 px-5 py-4 justify-between items-center border-b-2 border-black"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={`${
          isExpanded ? "Collapse" : "Expand"
        } local navigation menu`}
      >
        <h4 className={`${Heading["4-medium"]} text-content-strong`}>
          {parentTitle}
        </h4>
        {isExpanded ? (
          <MdKeyboardArrowUp className="w-6 h-auto flex-shrink-0" />
        ) : (
          <MdKeyboardArrowDown className="w-6 h-auto flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <ul>
          {pages.map(({ url, title, isCurrent, childPages }) => {
            return (
              <li
                className={`border-b border-divider-medium ${Paragraph[3]} text-content`}
              >
                {isCurrent ? (
                  <p className="font-bold block py-4 px-5">{title}</p>
                ) : (
                  <LinkComponent
                    href={url}
                    className="block py-4 px-5 hover:bg-interaction-sub active:underline active:underline-offset-2"
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
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const SiderailDesktop = ({
  parentTitle,
  parentUrl,
  pages,
  LinkComponent = "a",
}: Omit<SiderailProps, "type">) => {
  return (
    <div className="hidden lg:flex flex-col max-w-60">
      <LinkComponent
        href={parentUrl}
        className="flex gap-2 items-start pb-2 border-b-2 border-black"
      >
        <BiLeftArrowAlt className="w-6 h-9 flex-shrink-0" />
        <h4 className={`${Heading["4-medium"]} text-content-strong`}>
          {parentTitle}
        </h4>
      </LinkComponent>

      <ul>
        {pages.map(({ url, title, isCurrent, childPages }, index) => {
          return (
            <li
              className={`${Paragraph[3]} ${
                index !== pages.length - 1 && "border-b border-divider-medium"
              } text-content`}
            >
              {isCurrent ? (
                <p className="font-bold block py-3 px-2">{title}</p>
              ) : (
                <LinkComponent
                  href={url}
                  className="block py-3 hover:bg-interaction-sub active:underline active:underline-offset-2"
                >
                  <p className="px-2">{title}</p>
                </LinkComponent>
              )}
              {isCurrent && (
                <ul>
                  {childPages?.map(({ url, title }, index) => {
                    return (
                      <li>
                        <LinkComponent
                          href={url}
                          className={`block py-2.5 pl-10 hover:bg-interaction-sub active:underline active:underline-offset-2 ${
                            index === childPages.length - 1 && "pb-3"
                          }`}
                        >
                          {title}
                        </LinkComponent>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export const Siderail = (props: Omit<SiderailProps, "type">) => {
  return (
    <>
      <SiderailMobile {...props} />
      <SiderailDesktop {...props} />
    </>
  )
}

export default Siderail
