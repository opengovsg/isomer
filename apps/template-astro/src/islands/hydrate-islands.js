// Browser half of the islands runtime: hydrates every <isomer-island> rendered by
// render-island.js. Only the modules of islands present on the page are downloaded, and React
// (or preact/compat, see astro.config.mjs) is only downloaded if the page has any island.
import { loaders } from "virtual:isomer-islands"

// When each island hydrates, keyed by component name. Anything not listed hydrates on load.
const HYDRATE_WHEN = {
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

const whenVisible = (island, callback) => {
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

const whenIdle = (callback) =>
  "requestIdleCallback" in window
    ? requestIdleCallback(callback)
    : setTimeout(callback, 200)

/** Turns data-props JSON back into props, replacing { $slot } with its server-rendered HTML. */
const toProps = (json, slotHtml, createElement) => {
  if (Array.isArray(json))
    return json.map((item) => toProps(item, slotHtml, createElement))
  if (!json || typeof json !== "object") return json
  if ("$slot" in json)
    return createElement("isomer-slot", {
      "data-slot": json.$slot,
      suppressHydrationWarning: true,
      dangerouslySetInnerHTML: { __html: slotHtml[json.$slot] ?? "" },
    })
  return Object.fromEntries(
    Object.entries(json).map(([key, value]) => [
      key,
      toProps(value, slotHtml, createElement),
    ]),
  )
}

const islands = document.querySelectorAll("isomer-island")
const react = islands.length
  ? Promise.all([import("react"), import("react-dom/client")])
  : undefined

for (const island of islands) {
  const { component, islandId, props } = island.dataset
  const [moduleKey, exportName] = component.split("#")
  // Read slot HTML now, before any island's hydration can change the DOM.
  const slotHtml = Object.fromEntries(
    [...island.querySelectorAll("isomer-slot")].map((slot) => [
      slot.dataset.slot,
      slot.innerHTML,
    ]),
  )

  const hydrate = async () => {
    const [[{ createElement }, { hydrateRoot }], module] = await Promise.all([
      react,
      loaders[moduleKey](),
    ])
    const element = createElement(
      module[exportName],
      toProps(JSON.parse(props), slotHtml, createElement),
    )
    hydrateRoot(island, element, { identifierPrefix: islandId })
  }

  const when = HYDRATE_WHEN[exportName] ?? "load"
  if (when === "visible") whenVisible(island, hydrate)
  else if (when === "idle") whenIdle(hydrate)
  else hydrate()
}
