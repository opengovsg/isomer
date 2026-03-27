import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { PLACEHOLDER_ALT_TEXT, PLACEHOLDER_PAGE_SUMMARY } from "./constants";

const getEngine = () =>
  createOpenAICompatible({
    name: "pair-engine",
    baseURL: "https://engine.pair.gov.sg",
    apiKey: process.env.PAIR_FOUNDRY_API_KEY,
  });

export const generateImageAltText = async (imageUrl: string) => {
  const foundryEngineProvider = getEngine();
  const chatModel = foundryEngineProvider.chatModel("claude-sonnet-4-6-v1:rsn");
  const maxCharacters = 120;

  // Check if the imageUrl returns a 200 status code before making the API call
  try {
    const response = await fetch(imageUrl, { method: "HEAD" });
    if (!response.ok) {
      console.warn(
        `Image URL ${imageUrl} is not accessible. Status: ${response.status}`
      );
      return PLACEHOLDER_ALT_TEXT;
    }
  } catch (error) {
    console.error(`Error accessing image URL ${imageUrl}:`, error);
    return PLACEHOLDER_ALT_TEXT;
  }

  try {
    const response = await generateText({
      model: chatModel,
      messages: [
        {
          role: "system",
          content: `You generate alternative text (alt text) for images for visually impaired users.
Your job:
- Describe the key visual information clearly and concretely.
- Mention only what is visible, no guessing or extra context.
- Use plain language, no emojis.
- HARD LIMIT: Your response MUST be a single sentence of at most ${maxCharacters} characters.
- Do NOT include quotes or the words "alt text" in your answer. It cannot be empty, contain only spaces, or have generic terms like 'image', 'logo', 'graph', etc.
Return ONLY the alt text, nothing else.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Describe this image for a visually impaired user in at most ${maxCharacters} characters.`,
            },
            {
              type: "image",
              image: new URL(imageUrl),
            },
          ],
        },
      ],
      maxOutputTokens: 300,
    });

    return response.text.trim() || PLACEHOLDER_ALT_TEXT;
  } catch (error) {
    console.error("Error generating image alt text:", error);
  }
};

export const generatePageSummary = async (
  title: string,
  pageContent: string
) => {
  const foundryEngineProvider = getEngine();
  const chatModel = foundryEngineProvider.chatModel("claude-sonnet-4-6-v1:rsn");
  const maxCharacters = 250;

  try {
    const response = await generateText({
      model: chatModel,
      messages: [
        {
          role: "system",
          content: `You are a content writing expert for government agency websites.

Write and return a summary text for the page content which is provided as a JSON string below. The title of this page is ${title}.

This summary will be displayed at the top of a webpage and gives visitors a reason to read on.

Follow these rules to craft the summary:

- The summary should have 1) the main Call-to-Action for the reader and 2) the key idea of the page.
- Do not insert new messages or ideas that are not explicitly present in the page content
- Do not repeat sentences from the page as-is
- Aim for 1 or 2 sentences, max 3.
- Keep to less than 20 words per sentence.
- Replace long or unfamiliar words with shorter, more common terms.
- HARD LIMIT: ${maxCharacters} characters is the absolute maximum  — however, it is not a target. Use only as many characters as needed.
- HARD REQUIREMENT: DO NOT ask for any additional information, generate the summary based on the information given, and if you think the information is insufficient, make assumptions based on typical Singapore government website content and generate the best possible summary you can. NEVER say "Based on the information provided, I don't have enough information to generate a good summary" or any similar statements. ALWAYS generate a summary regardless of the information given, and make assumptions where necessary.

Make sure the summary follows these stylistic rules:

- Match the tone and style of the page content
- End in a full stop
- Do not use headers or bullet points
- Use passive sentences only when necessary
- Use British English and spelling
- Don't use em-dashes unless absolutely necessary

These are examples of bad summaries:

- "Learn more about our open source products."
- "Pages in this section."
- "Stay active in your golden years with Age Well SG."
- “Sanctions for violating anti-doping rule violation may range from a reprimand to a lifetime ban. The period of ineligibility may vary depending on the type of anti-doping rule violation, the circumstances of each case, the substance, and the possible repetition of an anti-doping rule violation.”

These are examples of better summaries:

- “Discover investment opportunities and be part of Singapore's tourism future.”
- “As an athlete, you are strictly liable for any prohibited substance found in your system, regardless of intent. Learn what's banned, how to check your medications, and how to stay compliant.”
- “The “Wah! Singapore” report is a bi-annual publication that covers fun community events in Singapore. Download and read the latest edition.”

Return ONLY the summary text, nothing else.`,
        },
        {
          role: "user",
          content: pageContent,
        },
      ],
    });

    return response.text.trim() || PLACEHOLDER_PAGE_SUMMARY;
  } catch (error) {
    console.error("Error generating page summary:", error);
    return "";
  }
};
