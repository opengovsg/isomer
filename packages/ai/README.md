# @isomer/ai

Shared Pair Foundry client for Isomer. This package does **not** import application env modules and does **not** own product prompts. Callers pass a validated API key, a model id, and the text (and optional image) they want the model to see.

## API

- **`createFoundryClient({ apiKey })`** — returns a client bound to `https://engine.pair.gov.sg`:
  - `generateText({ modelId, system, prompt, image?, maxOutputTokens? })` — one completion. `image` is `{ bytes, mimeType }`. Throws when the model returns empty text.
  - `generateObject({ modelId, system, prompt, schema, schemaName?, schemaDescription?, image?, maxOutputTokens? })` — one completion parsed and checked against `schema`. Throws when the model returns no object.

## Usage in Studio

Keep a thin adapter in the app that reads validated env. Alt-text suggestions live in `apps/studio/src/lib/generateAltText.ts` and call `generateObject` with a Zod schema.
