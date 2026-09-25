import { generateText } from "ai"
import { foundryClient } from "~/lib/foundry"

const ALT_TEXT_MAX_CHARACTERS = 120

const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
])

export const isAltTextGenerationSupportedForMimeType = (
  mimeType: string,
): boolean => SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)

export const generateAltText = async (imageUrl: string): Promise<string> => {
  if (!foundryClient) {
    throw new Error("PAIR_FOUNDRY_API_KEY is not set")
  }

  const response = await generateText({
    model: foundryClient.chatModel("claude-sonnet-4-6-v1:rsn"),
    allowSystemInMessages: true,
    messages: [
      {
        role: "system",
        content: `You generate alternative text (alt text) for images for visually impaired users.
Your job:
- Describe the key visual information clearly and concretely.
- Mention only what is visible, no guessing or extra context.
- Use plain language, no emojis.
- HARD LIMIT: Your response MUST be a single sentence of at most ${ALT_TEXT_MAX_CHARACTERS} characters.
- Do NOT include quotes or the words "alt text" in your answer. It cannot be empty, contain only spaces, or have generic terms like 'image', 'logo', 'graph', etc.
Return ONLY the alt text, nothing else.`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Describe this image for a visually impaired user in at most ${ALT_TEXT_MAX_CHARACTERS} characters.`,
          },
          { type: "image", image: new URL(imageUrl) },
        ],
      },
    ],
    maxOutputTokens: 300,
  })

  const text = response.text.trim()
  if (!text) {
    throw new Error("Foundry returned no text")
  }

  return text
}
