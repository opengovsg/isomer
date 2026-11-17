// Browser half of the islands runtime: hydrates every <isomer-island> rendered by
// render-island.ts. Only the modules of islands present on the page are downloaded, and React
// (or preact/compat, see astro.config.ts) is only downloaded if the page has any island.
import { loaders } from "virtual:isomer-islands"

type HydrateWhen = "load" | "visible" | "idle"

// When each island hydrates, keyed by component name. Anything not listed hydrates on load.
const HYDRATE_WHEN: Record<string, HydrateWhen> = {
  // Below the fold or decorative: wait until scrolled near.
  ImageGalleryClient: "visible",
  HeroCarouselBlockClient: "visible",
  HeroCarouselGradientClient: "visible",
  LiteYouTubeEmbed: "visible",
  LiteVimeoEmbed: "visible",
  // Never urgent: wait until the browser is idle.
  VicaWidgetClient: "idle",
  AskgovWidgetClient: "idle",
  ZendeskWidget: "idle",
  MicrosoftClarity: "idle",
  UnsupportedBrowserBanner: "idle",
}

const whenVisible = (island: HTMLElement, callback: () => void) => {
  // <isomer-island> is display: contents and has no box, so watch its first element instead.
  const target = island.firstElementChild ?? island
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect()
        callback()
      }
    },
    { rootMargin: "200px" },
  )
  observer.observe(target)
}

const whenIdle = (callback: () => void) =>
  "requestIdleCallback" in window
    ? requestIdleCallback(callback)
    : setTimeout(callback, 200)

const islands = document.querySelectorAll<HTMLElement>("isomer-island")
const importReact = () =>
  Promise.all([import("react"), import("react-dom/client")])
// Shared by every island. Started up front so it downloads in parallel with the island modules,
// and never started on pages without islands.
let react: ReturnType<typeof importReact> | undefined
const loadReact = () => (react ??= importReact())
if (islands.length) void loadReact()

for (const island of islands) {
  const { component = "", islandId, props = "{}" } = island.dataset
  const [moduleKey = "", exportName = ""] = component.split("#")

  const hydrate = async () => {
    const loadModule = loaders[moduleKey]
    if (!loadModule)
      throw new Error(`[isomer-islands] unknown island ${component}`)
    const [[{ createElement }, { hydrateRoot }], module] = await Promise.all([
      loadReact(),
      loadModule(),
    ])
    const Component = module[exportName]
    if (!Component)
      throw new Error(`[isomer-islands] ${component} is not exported`)

    const element = createElement(
      Component,
      JSON.parse(props) as Record<string, unknown>,
    )
    hydrateRoot(island, element, { identifierPrefix: islandId })
  }

  const when = HYDRATE_WHEN[exportName] ?? "load"
  if (when === "visible") whenVisible(island, () => void hydrate())
  else if (when === "idle") whenIdle(() => void hydrate())
  else void hydrate()
}
