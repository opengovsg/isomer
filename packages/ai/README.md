# @isomer/ai

Shared Pair Foundry client for Isomer. This package does **not** import application env modules and does **not** own product prompts. Callers pass a validated API key, a model id, and the text (and optional image) they want the model to see. The client returns the model's trimmed text.

## API

- **`createFoundryClient({ apiKey })`** — returns a client bound to `https://engine.pair.gov.sg`:
  - `generateText({ modelId, system, prompt, image?, maxOutputTokens? })` — one completion. `image` is `{ bytes, mimeType }`. Throws when the model returns empty text.

## Usage in Studio

Keep a thin adapter in the app that reads validated env, then call `generateText` from the use case. Alt-text suggestions live in `apps/studio/src/lib/generateAltText.ts`.
