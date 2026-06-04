# Component & primitive mapping: Chakra → OUI / Tailwind

Source of truth for the new API is the OUI docs: https://oui.open.gov.sg/llms.txt and the
per-component `https://oui.open.gov.sg/llm/...md` pages, plus the OUI source at
https://github.com/opengovsg/oui-design-system. The tables below are the migration map;
when a cell says "verify", read the OUI page for that component before editing.

OUI is built on **react-aria-components**, so APIs are composition-first and prop names
follow react-aria conventions (`isDisabled` not `disabled`, `onPress` not `onClick`,
`isSelected`, `selectedKey`, render-prop children, etc.). Chakra style props
(`mt`, `px`, `bg`, `color`, `w`, …) do **not** exist on OUI components — use Tailwind
`className` on the element/wrapper instead.

Counts below are usages found in `apps/studio/src/` at migration start (rough scale).

---

## Track A / B2 — components → OUI

| Chakra (DS = design-system-react, raw = @chakra-ui/react) | OUI | Notes |
|---|---|---|
| `Button` (DS 46, raw 19), `ButtonProps` | `Button` | `onClick`→`onPress`; `isDisabled`/`isLoading`; map `variant`/`colorScheme`/`size` to OUI variants (verify names) |
| `IconButton` (DS 14, raw 9) | `Button` (icon-only) | render icon as child; provide `aria-label` |
| `useToast` (DS 27) | OUI Toast | **biggest behavioural change** — verify the provider + trigger API on the OUI Toast page; likely a queue/`toast(...)` fn rather than a hook returning a fn |
| `FormControl`/`FormLabel`/`FormErrorMessage` (43/13/…) | `Field` primitives | OUI composes label/description/error via `Field`; restructure markup |
| `Input` (raw 11), `InputGroup`/`InputLeftAddon` | `TextField` | addons → compose within `TextField`/`Field` |
| `Textarea` (DS) | `TextAreaField` | |
| `NumberInput*` (`NumberInputField`/`NumberDecrementStepper`/…) | `NumberField` | single component replaces the Chakra sub-parts |
| `SingleSelect` (DS) | `Select` (non-filterable) / `ComboBox` (filterable) | choose by whether the old one allowed typing to filter |
| `Menu`/`MenuButton`/`MenuList`/`MenuItem`/`MenuItemOption`/`MenuOptionGroup` (DS 10, raw …) | `Menu` | render-prop/collection API; `onClick`→`onAction`/`onPress` |
| `Modal`/`ModalOverlay`/`ModalContent`/`ModalHeader`/`ModalBody`/`ModalFooter`/`ModalCloseButton` (raw 35) | `Modal` | OUI Modal is composition-based; pair with `useDisclosure` replacement (see B3) for open state |
| `Tooltip` (raw 13), `TouchableTooltip` (DS), `TooltipProps` | `Tooltip` | hover/focus content; verify trigger wrapping |
| `Popover`/`PopoverContent`/`PopoverTrigger`/`PopoverBody` (raw 4) | OUI overlay (`Popover`/`Dialog`/`Tooltip`) | verify the closest OUI overlay; may need react-aria `Popover` directly |
| `Infobox` (DS 9) | `Infobox` | |
| `Banner` (DS) | `Banner` | |
| `Badge`/`BadgeLeftIcon` (DS 5, raw 3) | `Badge` | |
| `Link` (DS 5, raw 10), `LinkProps`, `LinkBox`/`LinkOverlay` | `Link` | needs `RouterProvider` (Foundation); `LinkBox`/`LinkOverlay` → compose with a clickable card pattern |
| `Tabs`/`TabList`/`Tab`/`TabPanels`/`TabPanel` (raw), `useTab` | `Tabs` | collection API; `selectedKey`/`onSelectionChange` |
| `Accordion`/`AccordionItem`/`AccordionButton`/`AccordionPanel`/`AccordionIcon` (raw 2) | `Accordion` | |
| `Breadcrumb`/`BreadcrumbItem`/`BreadcrumbLink` (DS, raw 7) | `Breadcrumbs` | |
| `Pagination` (DS) | `Pagination` | |
| `Radio` (DS), `RadioGroup` (raw), `useRadio`/`useRadioGroup`/`UseRadioProps` | `RadioGroup` | replaces the headless `useRadio` pattern entirely |
| `Switch` (DS) | `Toggle` (Switch) | `isSelected`/`onChange` |
| `Checkbox*` | `Checkbox` / `CheckboxGroup` | |
| `Searchbar` (DS) | `SearchField` | |
| `Table`/`Thead`/`Tbody`/`Tr`/`Th`/`Td` (raw 2/2/…) | OUI `Table` | verify subcomponent/collection API; if OUI Table doesn't fit a use case, a semantic `<table>` + Tailwind is acceptable (flag it) |
| `Spinner` (DS, raw 1) | **OUI `Spinner`** | exists in the package though undocumented — import from `@opengovsg/oui` |
| `RestrictedGovtMasthead` (DS) | **OUI `GovtBanner`** | |
| `Avatar` | `Avatar` | |
| `Calendar`/date inputs (if any) | `Calendar`/`DateField`/`DatePicker`/`DateRangePicker`/`TimeField` | |
| `Image` (raw 1) | `next/image` or `<img>` + Tailwind | OUI has no Image; use Next idiom |
| `Card` (raw 1) | Tailwind composition | no OUI Card — build with `<div>` + utilities (flag) |

---

## Track B1 — raw layout/typography → plain Tailwind

No OUI component; replace with semantic element + Tailwind utilities. Move Chakra style props
onto `className`. Spacing tokens: Chakra numeric scale (4 = 1rem) → Tailwind scale (`4` = 1rem),
so the numbers usually map 1:1 (verify against `apps/studio` theme tokens for custom values).

| Chakra | Replacement | Hints |
|---|---|---|
| `Box` (99), `BoxProps` | `<div className>` | generic container |
| `Flex` (72), `FlexProps` | `<div className="flex …">` | `direction="column"`→`flex-col`; `align`→`items-*`; `justify`→`justify-*` |
| `HStack` (60) | `<div className="flex items-center gap-…">` | `spacing`→`gap-*` |
| `VStack` (70) | `<div className="flex flex-col gap-…">` | |
| `Stack` (23), `StackProps` | `<div className="flex flex-col gap-…">` | horizontal `Stack` → `flex-row` |
| `Grid` (12)/`GridItem` (11), `GridProps`/`GridItemProps` | `<div className="grid …">` / grid-child utilities | `templateColumns`→`grid-cols-*`; `gap`→`gap-*`; `colSpan`→`col-span-*` |
| `SimpleGrid` (1) | `<div className="grid grid-cols-…">` | |
| `Spacer` (6) | `flex-1` on a child, or `justify-between` on the parent | |
| `Center` (5) | `<div className="flex items-center justify-center">` | |
| `Wrap` (4) | `<div className="flex flex-wrap gap-…">` | |
| `Container` (1) | `<div className="mx-auto max-w-… px-…">` | |
| `Divider` (10) | `<hr className="border-…">` or bordered `<div>` | vertical → `border-l h-full` |
| `Text` (129), `TextProps` | `<p>`/`<span>` + `text-*`/`font-*`/`leading-*`/`text-…-content` | match the theme text style |
| `Heading` (2) | `<h1>`–`<h6>` + Tailwind type scale | |
| `List`/`ListItem`/`UnorderedList` (2/7/5) | `<ul>`/`<ol>`/`<li>` + `list-disc`/`space-y-*` | |
| `chakra` factory (37), e.g. `chakra.span` | plain element + `className` | each `chakra.X` becomes `<X className>` |
| `Skeleton` (raw 27) | OUI skeleton if present, else Tailwind `animate-pulse bg-… rounded` | verify OUI; otherwise a small shared `<Skeleton>` Tailwind component |
| `Portal` (8) | react-aria overlay (preferred inside OUI overlays) or React `createPortal` | see B3 |

---

## Track B3 — hooks / factories / theme utilities → shim or idiom

| Chakra | Replacement | Notes |
|---|---|---|
| `useDisclosure` (30), `UseDisclosureReturn` | react-aria `useOverlayTriggerState`, or a tiny local `useDisclosure` shim returning `{ isOpen, onOpen, onClose, onToggle }` | a shim minimises churn across many call sites; put it in `apps/studio/src/hooks/` |
| `Icon` (51), `IconProps` | render the icon component directly (`<SomeIcon className="h-… w-…" />`) | Chakra wrapped icons via `as`; drop the wrapper |
| `Portal` (8) | OUI/react-aria overlays render in a portal already; for standalone use `createPortal` | |
| `useToken` (3), `useTheme` (2), `useBreakpointValue` (1) | read CSS variables / use Tailwind tokens / container queries or `useMediaQuery` | avoid runtime theme reads where a class works |
| `useMultiStyleConfig` (5), `createMultiStyleConfigHelpers` (1), `useStyleConfig` | replace the styled component with OUI + Tailwind variants (e.g. `tailwind-variants`/`cva`) | these back custom Chakra components; migrate the whole component |
| `useClipboard` (1) | `navigator.clipboard.writeText` + small local hook | |
| `forwardRef` from `@chakra-ui/react` (2) | `React.forwardRef` | swap import only |
| `useToken`/`cssVar`/`useToken` style helpers | Tailwind classes / CSS vars | |
| `extendTheme`/`ChakraProps`/`SystemStyleObject`/`SystemStyleInterpolation`/`ThemeProvider` | removed in **final cleanup** with the Chakra theme | |
| `UseToastOptions` | typed from the OUI Toast API | migrate with `useToast` |

---

## Prop translation cheatsheet (react-aria conventions)

| Chakra | OUI / react-aria |
|---|---|
| `onClick` | `onPress` |
| `disabled` / `isDisabled` | `isDisabled` |
| `isLoading` | `isPending` / `isLoading` (verify per component) |
| `isChecked` / `onChange` (toggles) | `isSelected` / `onChange` |
| `value`/`onChange` (select) | `selectedKey`/`onSelectionChange` |
| `isOpen`/`onClose` (overlays) | controlled via trigger state / `isOpen`+`onOpenChange` (verify) |
| style props (`mt`, `px`, `bg`, `w`, `color`) | Tailwind `className` |

When unsure of an OUI prop or whether a component exists, **stop and read the OUI page** for it.
If there is no equivalent, flag the gap in the PR and the playbook's gaps register rather than
guessing — a wrong prop that still type-checks can pass the visual diff and ship a subtle bug.
