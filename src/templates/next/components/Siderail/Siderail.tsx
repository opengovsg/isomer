import { BiLeftArrowAlt } from "react-icons/bi"
import { SiderailProps } from "~/common"
import { Heading } from "../../typography/Heading"
import { Paragraph } from "../../typography/Paragraph"
import { useState } from "react"
import { MdKeyboardArrowUp, MdKeyboardArrowDown } from "react-icons/md"

const SiderailMobile = ({
  parentTitle,
  parentUrl,
  items,
  LinkComponent = "a",
}: Omit<SiderailProps, "type">) => {
  const [isExpanded, setIsExpanded] = useState(false)
  return (
    <div className="lg:hidden">
      <button
        className="w-full flex gap-2 px-5 py-4 justify-between items-center border-b-2 border-black"
        onClick={() => setIsExpanded(!isExpanded)}
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

      {isExpanded &&
        items.map((item) => {
          return (
            <div
              className={`border-b border-divider-medium ${Paragraph[3]} text-content`}
            >
              <LinkComponent
                href={item.url}
                className={`${
                  item.isCurrent ? "font-bold" : ""
                } block py-4 px-5 hover:bg-interaction-sub active:underline active:underline-offset-2 `}
              >
                {item.title}
              </LinkComponent>
              {item.isCurrent &&
                item.children &&
                item.children.map((child, index) => {
                  return (
                    <LinkComponent
                      href={child.url}
                      className={`block py-1.5 pl-12 hover:bg-interaction-sub active:underline active:underline-offset-2 ${
                        index === item.children!.length - 1 && "pb-4"
                      }`}
                    >
                      {child.title}
                    </LinkComponent>
                  )
                })}
            </div>
          )
        })}
    </div>
  )
}

const SiderailDesktop = ({
  parentTitle,
  parentUrl,
  items,
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

      {items.map((item, index) => {
        return (
          <div
            className={`${Paragraph[3]} ${
              index !== items.length - 1 && "border-b border-divider-medium"
            } text-content`}
          >
            <LinkComponent
              href={item.url}
              className={`${
                item.isCurrent ? "font-bold" : ""
              } block py-3 hover:bg-interaction-sub active:underline active:underline-offset-2`}
            >
              {item.title}
            </LinkComponent>
            {item.isCurrent &&
              item.children &&
              item.children.map((child, index) => {
                return (
                  <LinkComponent
                    href={child.url}
                    className={`block py-2.5 pl-10 hover:bg-interaction-sub active:underline active:underline-offset-2 ${
                      index === item.children!.length - 1 && "pb-3"
                    }`}
                  >
                    {child.title}
                  </LinkComponent>
                )
              })}
          </div>
        )
      })}
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
