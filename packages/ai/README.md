# @isomer/ai

Shared Pair Foundry client for Isomer. This package does **not** import application env modules and does **not** own product prompts. Callers pass a validated API key, a model id, and the text (and optional image) they want the model to see.

## API

- **`createFoundryClient({ apiKey })`** — returns a client bound to `https://engine.pair.gov.sg`:
  - `generateText({ modelId, system, prompt, imageUrl?, maxOutputTokens? })` — one completion. When `imageUrl` is set, the user message is a text part plus `image: new URL(imageUrl)`. Throws when the model returns empty text.

## Usage in Studio

Keep a thin adapter in the app that reads validated env. Alt-text suggestions live in `apps/studio/src/lib/generateAltText.ts` and call `generateText` the same way as the classic-migration script: a system prompt, a short user prompt, and the image URL.
