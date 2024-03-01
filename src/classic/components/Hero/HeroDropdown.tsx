import { useState } from "react"
import { type HeroDropdownProps } from "~/common/Hero"

const BP_BUTTON_CLASSES =
  "rounded-none box-content appearance-none items-center border border-solid border-[#f0f0f0] shadow-none inline-flex text-base h-9 justify-center px-3 py-[calc(0.375rem-1px)] relative align-top select-none cursor-pointer text-center whitespace-nowrap focus:outline-none active:outline-none disabled:cursor-not-allowed"

export const HeroDropdown = ({ title, options }: HeroDropdownProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <div className="block relative border-light w-full">
      <div className="w-full">
        <a
          className={`${BP_BUTTON_CLASSES} flex px-6 py-7 box-border justify-between bg-white border-0 border-b border-solid border-border-light m-auto w-[calc(100%-3rem)] text-xl font-semibold`}
          aria-haspopup
          aria-controls="hero-dropdown-menu"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {!!title ? (
            <span>
              <p>{title}</p>
            </span>
          ) : (
            <span>
              <p>I want to...</p>
            </span>
          )}
          <span className="justify-center h-4 w-4">
            {/* Chevron down */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 16 16"
              width="20"
              height="20"
              className="text-2xl -mt-0.5"
            >
              <path
                fill-rule="evenodd"
                d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"
              />
            </svg>
          </span>
        </a>
      </div>
      <div
        id="hero-dropdown-menu"
        role="menu"
        className={`absolute left-0 min-w-48 pt-0 w-full top-full z-20 text-start ${
          isDropdownOpen ? "block" : "hidden"
        }`}
      >
        <div className="bg-white rounded-none border border-solid border-border-light py-4 m-auto">
          {options.map(({ url: optionUrl, title: optionTitle }) => {
            return (
              optionUrl &&
              optionTitle && (
                <a
                  className="block relative text-prose hover:text-secondary text-xl px-6 py-3"
                  href={optionUrl}
                  rel={
                    optionUrl.startsWith("http")
                      ? "noopener noreferrer nofollow"
                      : ""
                  }
                  target={optionUrl.startsWith("http") ? "_blank" : ""}
                >
                  {optionTitle}
                </a>
              )
            )
          })}
        </div>
      </div>
    </div>
  )
}
