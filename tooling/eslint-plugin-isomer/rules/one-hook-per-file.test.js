import parser from "@typescript-eslint/parser"
import { RuleTester } from "eslint"
import { describe, it } from "vitest"

import oneHookPerFile from "./one-hook-per-file.js"

RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
  },
})

ruleTester.run("one-hook-per-file", oneHookPerFile, {
  valid: [
    {
      code: `export const useFoo = () => {}`,
      filename: "src/hooks/useFoo.ts",
    },
    {
      code: `export function useFoo() { return 1 }`,
      filename: "apps/studio/src/hooks/useFoo.ts",
    },
    {
      code: `
          const useInternal = () => {}
          export const usePublic = () => useInternal()
        `,
      filename: "src/hooks/usePublic.ts",
    },
    {
      code: `export const useFoo = () => {}`,
      filename: "src/lib/useFoo.ts",
    },
    {
      code: `export type UseFooOptions = { x: number }`,
      filename: "src/hooks/useFoo.ts",
    },
  ],
  invalid: [
    {
      code: `
          export const useFoo = () => {}
          export const useBar = () => {}
        `,
      filename: "src/hooks/useFoo.ts",
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: `
          export function useCollectionTags() {}
          export function useSuspenseCollectionTags() {}
        `,
      filename: "src/features/editing/hooks/useCollectionTags.ts",
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: `
          export const useA = () => {}
          export { useB }
          function useB() {}
        `,
      filename: "src/hooks/bundle.ts",
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
    {
      code: `
          export function useListRedirects() {}
          export function useCountRedirects() {}
        `,
      filename: "src/features/settings/Redirects/api.ts",
      errors: [{ messageId: "multipleHooks" }, { messageId: "multipleHooks" }],
    },
  ],
})
