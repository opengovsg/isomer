import { RuleTester } from "oxlint/plugins-dev"

import { oneHookPerFileRule } from "./one-hook-per-file.ts"

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: "ts" } },
})

tester.run("isomer/one-hook-per-file", oneHookPerFileRule, {
  valid: [
    "export const useFoo = () => {}",
    "export function useFoo() { return 1 }",
    `
      const useInternal = () => {}
      export const usePublic = () => useInternal()
    `,
    "export type UseFooOptions = { x: number }",
    `
      export { useFoo } from "./useFoo"
      export { useBar } from "./useBar"
    `,
    "export { foo as useFoo }",
    "export { useFoo as useBar }",
    `
      export { useFoo as notAHook }
      export const useBar = () => {}
    `,
    `
      export { notAHook as default }
      export const useBar = () => {}
    `,
    `
      export { notAHook as "default" }
      export const useBar = () => {}
    `,
    "export default function useFoo() {}",
    `
      export { useFoo as default } from "./a"
      export { useBar } from "./b"
    `,
    `
      export default function notAHook() {}
      export { useFoo } from "./a"
      export { useBar } from "./b"
    `,
    `
      export type { useFoo }
      export const useBar = () => {}
    `,
    "export { type useFoo, useBar }",
    "export { type useFoo as default, useBar }",
    `
      export type { useFoo }
      export { useBar } from "./useBar"
      export { useBaz } from "./useBaz"
    `,
    "export const { useFoo } = obj",
    "export const { foo: useFoo } = obj",
    "export const { useFoo: notAHook } = obj",
    "export const { useFoo: { useBar } } = obj",
    'export const { ["useFoo"]: notAHook } = obj',
    "export const [, useFoo] = pair",
    "export const { useFoo = fallback } = obj",
    "export const [...useRest] = items",
    "export const { nested: { useFoo } } = obj",
    "export let { useFoo } = obj",
    "export var [useFoo] = pair",
  ],
  invalid: [
    {
      code: `
        export const useFoo = () => {}
        export const useBar = () => {}
      `,
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: `
        export function useCollectionTags() {}
        export function useSuspenseCollectionTags() {}
      `,
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: `
        export function useListRedirects() {}
        export function useCountRedirects() {}
      `,
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: `
        export const useA = () => {}
        export { useB }
        function useB() {}
      `,
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: "export { useFoo as default, useBar }",
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: 'export { useFoo as "default", useBar }',
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: `
        export { foo as useFoo }
        export const useBar = () => {}
      `,
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: `
        export default function useFoo() {}
        export { useBar } from "./useBar"
      `,
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: `
        export type { useFoo }
        export const useBar = () => {}
        export function useBaz() {}
      `,
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: "export { type useFoo, useBar, useBaz }",
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: "export const { useFoo, useBar } = createHooks()",
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: "export const { foo: useFoo, bar: useBar } = obj",
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: "export const [useFoo, useBar] = pair",
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: "export let { useFoo, useBar } = createHooks()",
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: "export var [useFoo, useBar] = pair",
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: "export const [useFoo, , useBar] = pair",
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: 'export const { ["nope"]: useFoo, ["alsoNope"]: useBar } = obj',
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: `
        export const {
          nested: { useFoo },
          list: [useBar, , ...useRest],
          useBaz = fallback,
        } = obj
      `,
      errors: [
        { messageId: "multipleHooks" },
        { messageId: "multipleHooks" },
        { messageId: "multipleHooks" },
        { messageId: "multipleHooks" },
      ],
    },
  ],
})
