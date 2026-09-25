# @isomer/ai

Shared model calls for Isomer. This package does **not** import application env modules — callers pass plain inputs (image bytes, MIME type, page context).

## API

- **`generateAltText({ imageBytes, mimeType, context })`** — asks Bedrock (Claude vision, Converse API) for alt text and returns the sanitized suggestion.
- **`sanitizeAltText(rawText)`** — strips AI tells (generic prefixes, wrapping quotes, em dashes) from a model response.
- **`isAltTextGenerationSupportedForMimeType(mimeType)`** — true for the four raster formats the Converse API accepts (`png`, `jpeg`, `gif`, `webp`).

Region and model ID are hardcoded until the account's Bedrock access is confirmed. If they need to vary per environment, accept them as arguments from the caller rather than reading `process.env` here.

## Usage in Studio

Studio owns the feature flag, permissions, and asset fetch. See `apps/studio/src/server/modules/image/image.service.ts`.
