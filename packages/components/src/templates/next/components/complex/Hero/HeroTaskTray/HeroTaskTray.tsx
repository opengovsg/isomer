import type { HeroTaskTrayProps } from "~/interfaces/complex/Hero"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { getHeadingTag } from "~/utils/getHeadingTag"

import { ComponentContent } from "../../../internal/customCssClass"
import { ImageClient } from "../../../internal/ImageClient"
import { TaskTray } from "./TaskTray"

const HERO_TASK_TRAY_TITLE_ID = "hero-task-tray-title"

const heroTaskTrayStyles = tv({
  slots: {
    section: "bg-white pb-12 md:pb-16",
    grid: "grid grid-rows-[auto_minmax(0,1fr)_minmax(0,3fr)] lg:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)]",
    background: "relative col-start-1 row-start-1 row-end-3 overflow-hidden",
    backgroundImage:
      "absolute inset-0 h-full w-full object-cover object-center",
    backgroundGradient:
      "absolute inset-0 bg-gradient-to-r from-[rgba(0,0,0,85%)] to-[rgba(0,0,0,10%)] xl:from-[rgba(0,0,0,100%)]",
    heroContent:
      "relative z-10 col-start-1 row-start-1 flex flex-row justify-start py-16 text-start text-base-content-inverse",
    heroInner: "xl:max-w-50% flex w-full flex-col gap-9 sm:w-3/5",
    heroCopy: "flex flex-col gap-6",
    heroTitle: "prose-display-xl break-words",
    heroSubtitle: "prose-title-lg-regular",
    trayColumn: "z-20 col-start-1 row-start-2 row-end-4 self-stretch",
    trayPanel: [
      "flex h-full flex-col items-start gap-6 rounded-lg border border-base-divider-subtle bg-white p-8 shadow-[0_6px_24px_0_rgba(0,0,0,0.10)]",
      "md:px-10 md:pb-9",
    ],
    trayTitle: "prose-display-sm break-words text-base-content-strong",
  },
})

const styles = heroTaskTrayStyles()

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
  const TrayTitleTag = getHeadingTag(headingLevel + 1)
  const trimmedTrayTitle = taskTrayTitle?.trim()
  const itemHeadingLevel = headingLevel + (trimmedTrayTitle ? 2 : 1)

  return (
    <section className={styles.section()}>
      {/*
        Row 1 is the hero copy (py-16 matches the title's inset from the banner top).
        The tray spans rows 2–3, so its top sits on that same inset below the description.
        The image covers rows 1–2: 25% of the tray below lg (1fr of 1fr+3fr), 50% at lg.
        Row 3 stays in flow, so the section padding starts at the tray bottom.
      */}
      <div className={styles.grid()}>
        <div
          className={styles.background()}
          style={{ contain: "layout" }}
          aria-hidden
        >
          <ImageClient
            src={backgroundUrl}
            alt=""
            width="100%"
            className={styles.backgroundImage()}
            assetsBaseUrl={site.assetsBaseUrl}
            lazyLoading={false}
          />
          <div className={styles.backgroundGradient()} />
        </div>

        <div className={twMerge(ComponentContent, styles.heroContent())}>
          <div className={styles.heroInner()}>
            <div className={styles.heroCopy()}>
              <HeroTag className={styles.heroTitle()}>{title}</HeroTag>
              {subtitle && <p className={styles.heroSubtitle()}>{subtitle}</p>}
            </div>
          </div>
        </div>

        <div className={twMerge(ComponentContent, styles.trayColumn())}>
          {trimmedTrayTitle ? (
            <section
              className={styles.trayPanel()}
              aria-labelledby={HERO_TASK_TRAY_TITLE_ID}
            >
              <TrayTitleTag
                id={HERO_TASK_TRAY_TITLE_ID}
                className={styles.trayTitle()}
              >
                {trimmedTrayTitle}
              </TrayTitleTag>

              <TaskTray
                taskTrayItems={taskTrayItems}
                site={site}
                headingLevel={itemHeadingLevel}
              />
            </section>
          ) : (
            <div className={styles.trayPanel()}>
              <TaskTray
                taskTrayItems={taskTrayItems}
                site={site}
                headingLevel={itemHeadingLevel}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
