import { Fragment } from "react"
import { Disclosure, Menu, Transition } from "@headlessui/react"
import { BiMenu, BiSearch, BiX } from "react-icons/bi"

import type { LinkComponentType } from "~/types"

export interface NavbarLink {
  type: "single" | "dropdown"
  name: string
  eventKey?: string
  url?: string
  links?: NavbarLink[]
}

function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ")
}

export interface IsomerNavProps {
  id?: string
  logo: { url: string; alt: string }

  links: NavbarLink[]
  search?: {
    isEnabled: boolean
    searchUrl?: string
  }
  LinkComponent: LinkComponentType
}

export const IsomerNav = ({
  logo,
  links,
  search = { isEnabled: false },
  LinkComponent = "a",
}: IsomerNavProps) => {
  return (
    <>
      <Disclosure as="nav" className="bg-white shadow">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
              <div className="relative flex h-16 justify-between">
                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                    <span className="absolute -inset-0.5" />
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <BiX className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <BiMenu className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                  <div className="flex flex-shrink-0 items-center">
                    <LinkComponent href="/">
                      <img
                        className="h-8 w-auto"
                        src={logo.url}
                        alt={logo.alt}
                      />
                    </LinkComponent>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    {/* Current: "border-indigo-500 text-gray-900", Default: "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700" */}
                    {links.map((link) => {
                      if (link.type === "dropdown") {
                        return (
                          <Menu as="div" className="relative inline-block">
                            <div>
                              <Menu.Button className="mt-3 inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
                                {link.name}
                              </Menu.Button>
                            </div>
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-200"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                {link.links?.map((sublink) => {
                                  return (
                                    <Menu.Item key={sublink.name}>
                                      {({ active }) => (
                                        <LinkComponent
                                          href={sublink.url}
                                          className={classNames(
                                            active ? "bg-gray-100" : "",
                                            "block px-4 py-2 text-sm text-gray-700",
                                          )}
                                        >
                                          {sublink.name}
                                        </LinkComponent>
                                      )}
                                    </Menu.Item>
                                  )
                                })}
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        )
                      }
                      return (
                        <LinkComponent
                          href={link.url}
                          className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        >
                          {link.name}
                        </LinkComponent>
                      )
                    })}
                  </div>
                </div>
                {search.isEnabled && search.searchUrl && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                    <LinkComponent href={search.searchUrl}>
                      <button
                        type="button"
                        className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        <span className="absolute -inset-1.5" />
                        <span className="sr-only">Search</span>

                        <BiSearch className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </LinkComponent>
                  </div>
                )}
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 pb-4 pt-2">
                {/* Current: "bg-indigo-50 border-indigo-500 text-indigo-700", Default: "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700" */}
                {links.map((link) => {
                  if (link.type === "dropdown") {
                    return (
                      <Disclosure.Button
                        as="a"
                        href="#"
                        className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                      >
                        {link.name}
                      </Disclosure.Button>
                    )
                  }
                  return (
                    <Disclosure.Button
                      as="a"
                      href={link.url}
                      className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                    >
                      {link.name}
                    </Disclosure.Button>
                  )
                })}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </>
  )
}

export default IsomerNav
