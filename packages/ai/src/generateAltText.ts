import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { generateText } from "ai"

const FOUNDRY_BASE_URL = "https://engine.pair.gov.sg"
const FOUNDRY_MODEL_ID = "claude-sonnet-4-6-v1:rsn"

const getEngine = () => {
  const apiKey = process.env.PAIR_FOUNDRY_API_KEY
  if (!apiKey) {
    throw new Error("PAIR_FOUNDRY_API_KEY is not set")
  }

  return createOpenAICompatible({
    name: "pair-engine",
    baseURL: FOUNDRY_BASE_URL,
    apiKey,
  })
}

const EM_DASH = "—"

// Matches the model prefacing its answer the way we explicitly tell it not
// to. Kept as a code-level safety net (not just a prompt instruction) since
// these are the patterns that most visibly read as AI-generated.
const GENERIC_PREFIX_PATTERNS = [
  /^(this\s+is\s+)?(an?\s+)?image\s+of\s+/i,
  /^(this\s+is\s+)?(an?\s+)?picture\s+of\s+/i,
  /^(this\s+is\s+)?(an?\s+)?photo(graph)?\s+of\s+/i,
]

const SURROUNDING_TEXT_MAX_LENGTH = 500

export interface GenerateAltTextContext {
  pageTitle?: string
  componentType: string
  surroundingText?: string
}

export interface GenerateAltTextInput {
  imageBytes: Uint8Array
  mimeType: string
  context: GenerateAltTextContext
}

// Pair Foundry's vision models accept these raster formats. Callers should
// skip generation entirely (not call this function) for anything else, e.g.
// SVG, BMP, AVIF.
const FOUNDRY_IMAGE_FORMATS = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
])

export const isAltTextGenerationSupportedForMimeType = (
  mimeType: string,
): boolean => FOUNDRY_IMAGE_FORMATS.has(mimeType)

const SYSTEM_PROMPT = `You write alt text for images on Singapore government websites built with Isomer.

Before writing, silently classify the image as exactly one of:
- decorative: adds visual interest only, carries no information a reader needs
- informative: conveys information relevant to the page content
- functional-icon-link: acts as a control or link (e.g. a social media icon, a download icon)
- text-heavy-infographic: contains text or data that is central to its meaning (e.g. a chart, a poster, a scanned document)

The classification changes what you write, not whether you write it. Every image gets real, non-empty alt text — there is no such thing as skippable alt text in this system, even for decorative images. For a decorative image, describe it briefly and neutrally rather than inventing significance it doesn't have.

Alt text must explain why the image is on this page, not just catalogue what is visible in it. Use the page title, the component/block type, and any surrounding text you are given to infer that purpose. For a text-heavy infographic, summarise the point it is making rather than transcribing every label.

Write in plain, professional prose, in the same register as the rest of a Singapore government website.

Never do any of the following, because each one reads as obviously AI-generated and undermines trust in the page:
- Start with "Image of", "Picture of", or "Photo of"
- Use an em dash (—)
- Use "Label: description" colon-templating (e.g. "Chart: quarterly revenue")
- Use SEO or keyword-stuffing language
- Add commentary, caveats, or a description of your own reasoning

Respond with only the finished alt text. No quotation marks, no preamble, no classification label.`

const buildUserPrompt = ({
  pageTitle,
  componentType,
  surroundingText,
}: GenerateAltTextContext): string => {
  const lines = [`Component type: ${componentType}`]
  if (pageTitle) {
    lines.push(`Page title: ${pageTitle}`)
  }
  if (surroundingText) {
    lines.push(
      `Surrounding page text: ${surroundingText.slice(0, SURROUNDING_TEXT_MAX_LENGTH)}`,
    )
  }
  lines.push("Write the alt text for the attached image.")
  return lines.join("\n")
}

export const sanitizeAltText = (rawText: string): string => {
  let text = rawText.trim()

  // Strip a single layer of wrapping quotes the model sometimes adds despite
  // being told not to.
  text = text.replace(/^["'“]+|["'”]+$/g, "").trim()

  for (const pattern of GENERIC_PREFIX_PATTERNS) {
    text = text.replace(pattern, "")
  }

  // Em dashes read as an obvious AI tell — replace rather than reject so a
  // single em dash never fails an otherwise-good suggestion outright.
  text = text.replaceAll(EM_DASH, ", ")

  return text.replace(/\s+/g, " ").trim()
}

export const generateAltText = async ({
  imageBytes,
  mimeType,
  context,
}: GenerateAltTextInput): Promise<string> => {
  if (!isAltTextGenerationSupportedForMimeType(mimeType)) {
    throw new Error(
      `Unsupported image MIME type for alt text generation: ${mimeType}`,
    )
  }

  const foundryEngineProvider = getEngine()
  const chatModel = foundryEngineProvider.chatModel(FOUNDRY_MODEL_ID)

  const response = await generateText({
    model: chatModel,
    allowSystemInMessages: true,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: buildUserPrompt(context) },
          { type: "image", image: imageBytes, mediaType: mimeType },
        ],
      },
    ],
    maxOutputTokens: 300,
  })

  const rawText = response.text.trim()
  if (!rawText) {
    throw new Error("Foundry returned no alt text content")
  }

  return sanitizeAltText(rawText)
}
