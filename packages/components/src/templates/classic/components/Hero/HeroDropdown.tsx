"use client";

import { useState } from "react";

import type { HeroDropdownProps } from "~/interfaces/complex/Hero";

const BP_BUTTON_CLASSES =
  "rounded-none box-content appearance-none items-center border border-solid border-[#f0f0f0] shadow-none inline-flex text-base h-9 justify-center px-3 py-[calc(0.375rem-1px)] relative align-top select-none cursor-pointer text-center whitespace-nowrap focus:outline-none active:outline-none disabled:cursor-not-allowed";

export const HeroDropdown = ({ title, options }: HeroDropdownProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="border-light relative block w-full">
      <div className="w-full">
        <a
          className={`${BP_BUTTON_CLASSES} m-auto box-border flex w-[calc(100%-3rem)] justify-between border-0 border-b border-solid border-border-light bg-white px-6 py-7 text-xl font-semibold text-prose`}
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
          <span className="h-4 w-4 justify-center">
            {/* Chevron down */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
              width="20"
              height="20"
              className="-mt-0.5 text-2xl"
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
        className={`absolute left-0 top-full z-20 w-full min-w-48 pt-0 text-start ${
          isDropdownOpen ? "block" : "hidden"
        }`}
      >
        <div className="m-auto rounded-none border border-solid border-border-light bg-white py-4">
          {options.map(({ url: optionUrl, title: optionTitle }) => {
            return (
              optionUrl &&
              optionTitle && (
                <a
                  className="relative block px-6 py-3 text-xl text-prose hover:text-site-secondary"
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
            );
          })}
        </div>
      </div>
    </div>
  );
};
