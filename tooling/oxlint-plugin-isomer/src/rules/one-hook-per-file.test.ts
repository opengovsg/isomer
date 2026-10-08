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
  ],
})
