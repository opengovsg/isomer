import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime"

// TODO(isomer): confirm this region and model ID against the models this AWS
// account actually has Bedrock access enabled for — Claude vision models on
// Bedrock are only served from a subset of regions, and access is granted
// per-model per-account. If these need to be configurable per-environment,
// add them to ~/env.mjs following the pattern of the other AWS clients
// (e.g. R2_ACCOUNT_ID in ~/lib/s3.ts) rather than reading process.env
// directly here.
const BEDROCK_REGION = "ap-southeast-1"
const BEDROCK_ALT_TEXT_MODEL_ID =
  "apac.anthropic.claude-3-5-sonnet-20241022-v2:0"

const client = new BedrockRuntimeClient({ region: BEDROCK_REGION })

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

// Bedrock's Converse API only accepts these four raster formats. Callers
// should skip generation entirely (not call this function) for anything
// else, e.g. SVG, BMP, AVIF.
const BEDROCK_IMAGE_FORMATS_BY_MIME_TYPE: Record<
  string,
  "png" | "jpeg" | "gif" | "webp"
> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/gif": "gif",
  "image/webp": "webp",
}

export const isAltTextGenerationSupportedForMimeType = (
  mimeType: string,
): boolean => mimeType in BEDROCK_IMAGE_FORMATS_BY_MIME_TYPE

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
  const format = BEDROCK_IMAGE_FORMATS_BY_MIME_TYPE[mimeType]
  if (!format) {
    throw new Error(
      `Unsupported image MIME type for alt text generation: ${mimeType}`,
    )
  }

  const response = await client.send(
    new ConverseCommand({
      modelId: BEDROCK_ALT_TEXT_MODEL_ID,
      system: [{ text: SYSTEM_PROMPT }],
      messages: [
        {
          role: "user",
          content: [
            { image: { format, source: { bytes: imageBytes } } },
            { text: buildUserPrompt(context) },
          ],
        },
      ],
      inferenceConfig: { maxTokens: 200, temperature: 0.3 },
    }),
  )

  const rawText = response.output?.message?.content
    ?.map((block) => block.text ?? "")
    .join("")
    .trim()

  if (!rawText) {
    throw new Error("Bedrock returned no alt text content")
  }

  return sanitizeAltText(rawText)
}
