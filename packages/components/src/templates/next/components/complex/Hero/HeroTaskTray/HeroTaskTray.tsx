import type { HeroTaskTrayProps } from "~/interfaces/complex/Hero"
import { twMerge } from "~/lib/twMerge"
import { getHeadingTag } from "~/utils/getHeadingTag"

import { ComponentContent } from "../../../internal/customCssClass"
import { ImageClient } from "../../../internal/ImageClient"
import { TaskTray } from "./TaskTray"

export const HeroTaskTray = ({
  title,
  subtitle,
  backgroundUrl,
  taskTrayTitle,
  taskTrayItems,
  site,
  headingLevel,
}: HeroTaskTrayProps) => {
  const HeroTag = getHeadingTag(headingLevel)

  return (
    <section className="bg-white pb-12 md:pb-16">
      {/*
        Row 1 is the hero copy (py-16 matches the title's inset from the banner top).
        The tray spans rows 2–3, so its top sits on that same inset below the description.
        The image covers rows 1–2: 25% of the tray below lg (1fr of 1fr+3fr), 50% at lg.
        Row 3 stays in flow, so the section padding starts at the tray bottom.
      */}
      <div className="grid grid-rows-[auto_minmax(0,1fr)_minmax(0,3fr)] lg:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)]">
        <div
          className="relative col-start-1 row-start-1 row-end-3 overflow-hidden"
          style={{ contain: "layout" }}
          aria-hidden
        >
          <ImageClient
            src={backgroundUrl}
            alt=""
            width="100%"
            className="absolute inset-0 h-full w-full object-cover object-center"
            assetsBaseUrl={site.assetsBaseUrl}
            lazyLoading={false}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(0,0,0,85%)] to-[rgba(0,0,0,10%)] xl:from-[rgba(0,0,0,100%)]" />
        </div>

        <div
          className={twMerge(
            ComponentContent,
            "relative z-10 col-start-1 row-start-1 flex flex-row justify-start py-16 text-start text-base-content-inverse",
          )}
        >
          <div className="xl:max-w-50% flex w-full flex-col gap-9 sm:w-3/5">
            <div className="flex flex-col gap-6">
              <HeroTag className="prose-display-xl break-words">
                {title}
              </HeroTag>
              {subtitle && <p className="prose-title-lg-regular">{subtitle}</p>}
            </div>
          </div>
        </div>

        <div
          className={twMerge(
            ComponentContent,
            "z-20 col-start-1 row-start-2 row-end-4 self-stretch",
          )}
        >
          <TaskTray
            taskTrayTitle={taskTrayTitle}
            taskTrayItems={taskTrayItems}
            site={site}
            headingLevel={headingLevel}
          />
        </div>
      </div>
    </section>
  )
}
