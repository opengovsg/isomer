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
  const chatModel = foundryEngineProvider.chatModel("gpt4o:rsn");
  const maxCharacters = 120;

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

export const generatePageSummary = async (pageContent: string) => {
  const foundryEngineProvider = getEngine();
  const chatModel = foundryEngineProvider.chatModel("gpt4o:rsn");
  const maxCharacters = 250;

  try {
    const response = await generateText({
      model: chatModel,
      messages: [
        {
          role: "system",
          content: `You summarize rich-text page content for readers.
You are given the page contents as a JSON document similar to Tiptap editor output.

Rules:
- Extract only the human-readable text from the JSON.
- Ignore styling, formatting, and technical metadata.
- Write a concise, self-contained summary that gives a clear understanding of the page.
- Do not repeat the content verbatim; instead, synthesize the key points. Avoid filler words and fluff.
- HARD LIMIT: the summary must be at most ${maxCharacters} characters.
- Use plain text only (no bullets or headings).
`,
        },
        {
          role: "user",
          content:
            `Here is the page content as a JSON string. ` +
            `Summarize it in at most ${maxCharacters} characters:\n\n` +
            pageContent,
        },
      ],
    });

    return response.text.trim() || PLACEHOLDER_PAGE_SUMMARY;
  } catch (error) {
    console.error("Error generating page summary:", error);
    return "";
  }
};
