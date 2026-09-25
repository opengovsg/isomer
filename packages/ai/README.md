# @isomer/ai

Shared Pair Foundry client for Isomer. This package does **not** import application env modules and does **not** own product prompts. Callers pass a validated API key, a model id, an optional system prompt, and the user prompt.

## API

- **`createPairFoundryClient({ apiKey })`** — returns a client bound to `https://engine.pair.gov.sg`:
  - `generateText({ modelId, system?, prompt, maxOutputTokens? })` — one completion. `prompt` is the user message content. `maxOutputTokens` is forwarded only when the caller sets it. Throws when the model returns empty text.

## Usage in Studio

Keep a thin adapter in the app that reads validated env. Alt-text suggestions live in `apps/studio/src/lib/generateAltText.ts`. That call builds the image into the user prompt before it reaches this package.
