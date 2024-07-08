import { BiChevronDown } from "react-icons/bi"

import type { SidePaneProps } from "~/interfaces"

export interface SectionWithSiblings {
  parentTitle?: string
  parentPermalink?: string
  siblings: any[]
}

const SidePane = ({ sitemap, currentPermalink }: SidePaneProps) => {
  function findSectionAndSiblings(
    paths: any[],
    currentPermalink: string,
  ): SectionWithSiblings | null {
    for (const section of paths) {
      // Check if this is the parent section
      if (section.paths) {
        const match = section.paths.find(
          (child: any) => child.permalink === currentPermalink,
        )
        if (match) {
          // Exact match found, return the current section's siblings and parent title
          return {
            parentTitle: section.title,
            parentPermalink: section.permalink, // This is the title of the dropdown
            siblings: section.paths, // These are the items in the dropdown
          }
        }

        // Recursively check in child paths
        const found = findSectionAndSiblings(section.paths, currentPermalink)
        if (found) return found
      }
    }
    return null // Not found
  }

  const sectionWithSiblings = findSectionAndSiblings(
    sitemap.paths,
    currentPermalink,
  )
  const parentNodeSiblings = findSectionAndSiblings(
    sitemap.paths,
    sectionWithSiblings?.parentPermalink || "",
  )

  return (
    <aside className="w-64">
      <ul className="divide-y divide-solid divide-navItems">
        {parentNodeSiblings && (
          <>
            {parentNodeSiblings.siblings.map((sibling, index) => (
              <li
                key={index}
                className={`list-none py-2 ${
                  currentPermalink === sibling.permalink ? "font-bold" : ""
                }`}
              >
                <>
                  <div className="flex">
                    <a
                      href={sibling.permalink}
                      className={`m-1 p-1 ${
                        sibling.permalink ===
                        sectionWithSiblings?.parentPermalink
                          ? "font-semibold text-headings"
                          : "text-navItems"
                      }`}
                    >
                      {sibling.title}
                    </a>
                    {sibling.permalink ===
                      sectionWithSiblings?.parentPermalink &&
                      sectionWithSiblings?.siblings &&
                      sectionWithSiblings.siblings.length > 0 && (
                        <a className="cursor-pointer">
                          <BiChevronDown className="mx-3 mt-2.5 h-5 w-5 text-headings" />
                        </a>
                      )}
                  </div>
                  <ul>
                    {sibling.permalink ===
                      sectionWithSiblings?.parentPermalink &&
                      sectionWithSiblings?.siblings.map((sibling, index) => (
                        <li
                          key={index}
                          className={`ml-4 mt-2 list-none py-2 ${
                            currentPermalink === sibling.permalink
                              ? "font-semibold text-headings"
                              : "text-navItems"
                          }`}
                        >
                          <a href={sibling.permalink}>{sibling.title}</a>
                        </li>
                      ))}
                  </ul>
                </>
              </li>
            ))}
          </>
        )}
      </ul>
    </aside>
  )
}

export default SidePane
