// Type declarations for packages that ship CSS only (no .d.ts files).
declare module "@fontsource-variable/inter"
declare module "@fontsource-variable/inter/index.css"

// Vite's import.meta.glob — augment ImportMeta so TypeScript recognises it
// without requiring vite as a direct devDependency.
interface ImportMeta {
  glob<T = unknown>(
    pattern: string,
    options?: { eager?: boolean },
  ): Record<string, () => Promise<T>>
}
