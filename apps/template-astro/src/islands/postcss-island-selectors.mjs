// PostCSS plugin: makes the <isomer-island> wrapper invisible to :first-child, :last-child and
// :only-child.
//
// The wrapper is display: contents, so layout ignores it, but selectors don't: an island's root
// element is always the first/last/only child *of its wrapper*. That breaks Tailwind classes like
// `[&:not(:first-child)]:mt-6` (ImageGallery lost 24px of margin before this existed).
//
// Each pseudo-class is rewritten to "matches normally, unless it's an island root, in which case
// the wrapper must match instead":
//
//   :first-child  ->  :is(:first-child:where(:not(isomer-island > *)),
//                         :first-child:where(isomer-island:first-child > *))
//
// :where() adds no specificity, so the rewritten selector wins and loses exactly where it did before.
const PSEUDO_CLASSES = ["first-child", "last-child", "only-child"]
const WRAPPER = "isomer-island"

// (?<!\\) skips escaped colons inside Tailwind class names, e.g. .\[\&\:not\(\:first-child\)\].
const PSEUDO_CLASS = new RegExp(`(?<!\\\\):(${PSEUDO_CLASSES.join("|")})`, "g")

const rewrite = (selector) =>
  selector.replace(
    PSEUDO_CLASS,
    (_, pseudo) =>
      `:is(:${pseudo}:where(:not(${WRAPPER} > *)),:${pseudo}:where(${WRAPPER}:${pseudo} > *))`,
  )

export const islandSelectors = () => ({
  postcssPlugin: "isomer-island-selectors",
  Rule(rule) {
    if (rule.selector.includes(WRAPPER)) return
    PSEUDO_CLASS.lastIndex = 0
    if (PSEUDO_CLASS.test(rule.selector)) rule.selector = rewrite(rule.selector)
  },
})
islandSelectors.postcss = true
