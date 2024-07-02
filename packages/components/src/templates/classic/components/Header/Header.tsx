import React from "react"; // Import React

import type { HeaderProps } from "~/interfaces";

type Breadcrumb = {
  name: string;
  href: string;
  current?: boolean;
};

const Header: React.FC<HeaderProps> = ({ permalink, sitemap }) => {
  function findPageDetailsByPermalink(
    permalink: string,
    sitemap: any,
  ): { title: string; breadcrumbs: Breadcrumb[] } {
    let title: string = "";
    let breadcrumbs: Breadcrumb[] = [];

    function traverse(currentSitemap: any[], permalink: string) {
      for (const entry of currentSitemap) {
        const fullPath = entry.permalink;
        const pathTitle = entry.title;

        // Check if the current path segment is part of the permalink
        if (permalink.startsWith(fullPath)) {
          // If exact match, set title and mark current page in breadcrumbs
          if (permalink === fullPath) {
            title = pathTitle;
            breadcrumbs.push({
              name: pathTitle,
              href: fullPath,
              current: true,
            });
          } else {
            breadcrumbs.push({ name: pathTitle, href: fullPath });
          }

          if (entry.paths && entry.paths.length > 0) {
            traverse(entry.paths, permalink); // Continue traversing subPaths
          }
          break; // Stop the loop if a match is found
        }
      }
    }

    // Start traversing from root, adjusting initial path as empty
    traverse(sitemap.paths, permalink);

    // Remove 'current' flag from all but the last breadcrumb
    breadcrumbs.forEach((crumb, idx) => {
      if (idx < breadcrumbs.length - 1) {
        delete crumb.current;
      }
    });

    return { title, breadcrumbs };
  }

  const { title, breadcrumbs } = findPageDetailsByPermalink(permalink, sitemap);

  return (
    <nav
      className="flex h-full flex-col bg-header p-10"
      aria-label="Breadcrumb"
    >
      <div className="container max-w-5xl">
        <ol
          role="list"
          className="flex items-center overflow-scroll text-white"
        >
          {breadcrumbs.map((breadcrumb, idx) => (
            <li key={idx}>
              <div className="flex items-center">
                <a
                  href={breadcrumb.href}
                  className="tracking-wider text-sm font-light uppercase"
                  aria-current={breadcrumb.current ? "page" : undefined}
                >
                  {breadcrumb.name}
                </a>
                {idx !== breadcrumbs.length - 1 && (
                  <svg
                    className="mx-2 h-5 w-5 flex-shrink-0 text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                )}
              </div>
            </li>
          ))}
        </ol>
        <h1 className="truncate pt-5 text-3xl font-medium leading-7 text-white md:text-5xl">
          {title}
        </h1>
      </div>
    </nav>
  );
};

export default Header;
