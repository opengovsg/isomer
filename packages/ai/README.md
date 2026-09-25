# @isomer/ai

Shared model calls for Isomer. This package does **not** import application env modules — callers pass plain inputs (image bytes, MIME type, page context).

## API

- **`generateAltText({ imageBytes, mimeType, context })`** — asks Pair Foundry (`https://engine.pair.gov.sg`, model `claude-sonnet-4-6-v1:rsn`) for alt text and returns the sanitized suggestion. Reads `PAIR_FOUNDRY_API_KEY` from the environment.
- **`sanitizeAltText(rawText)`** — strips AI tells (generic prefixes, wrapping quotes, em dashes) from a model response.
- **`isAltTextGenerationSupportedForMimeType(mimeType)`** — true for `png`, `jpeg`, `gif`, and `webp`.

## Usage in Studio

Studio owns the feature flag, permissions, and asset fetch. See `apps/studio/src/server/modules/image/image.service.ts`.
