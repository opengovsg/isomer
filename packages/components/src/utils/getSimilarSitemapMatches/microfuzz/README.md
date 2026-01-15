# microfuzz

This is a copy of the [microfuzz](https://github.com/Nozbe/microfuzz) implementation, converted from Flow to TypeScript.

## Why we copied this implementation

We copied this implementation as-is (with minimal changes) because the original `@nozbe/microfuzz` package doesn't work well when importing in our webpack-based environment. This is due to issues with how webpack handles the package's module exports, as discussed in [this esbuild issue](https://github.com/evanw/esbuild/issues/1719#issuecomment-953470495).

The implementation has been converted from Flow to TypeScript to match our codebase standards, but the core logic and behavior remain unchanged from the original library.

## Why we continue to use microfuzz

We continue to choose microfuzz over other similarity and fuzzy match libraries because it's the most minimalist with zero dependencies and has the lightest bundle size. This is a priority for our use case where it's being exported to the client bundle, where every byte counts for performance.

## Default search strategy

Note: Despite the original microfuzz documentation stating that the default search strategy is "smart", in this codebase the default is actually "aggressive". We have removed the non-aggressive code paths to further reduce the bundle size, as we only use the aggressive strategy.
