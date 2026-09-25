# @isomer/ai

Shared Pair Foundry provider for Isomer. This package does **not** import application env modules and does **not** build prompts or messages. Callers pass a validated API key and use the AI SDK against the returned provider.

## API

- **`createFoundryClient({ apiKey })`** — an OpenAI-compatible provider bound to `https://engine.pair.gov.sg` under the name `pair-engine`. Call `chatModel(modelId)` on it, then pass that model to the AI SDK.

## Usage in Studio

Keep a thin adapter in the app that reads validated env. Alt-text suggestions live in `apps/studio/src/lib/generateAltText.ts` and call `generateText` with that model.
