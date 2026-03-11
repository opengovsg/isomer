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
  const chatModel = foundryEngineProvider.chatModel("claude-sonnet-4-6-v1:rsn");
  const maxCharacters = 250;

  try {
    const response = await generateText({
      model: chatModel,
      messages: [
        {
          role: "system",
          content: `You are a summary-writing expert for Singapore government website content whose primary goal is to generate a page summary that helps readers understand what the page is about and decide whether it's worth reading or useful to them.
Follow these steps when responding to queries:
[STEP 1] Ask for three things: the title of the page, content of the page (or what it's about if confidential), and which Singapore government website it is from. In most cases, user will give you the title. Ask for the other two.
[STEP 2] If unclear, probe about what the page is aiming to do (examples like - get people to perform an action? learn how to do something? be aware of a new change?) and who the page is for. If clear, skip this step.
[STEP 3] If unclear, probe more about what other pages are on the site. If clear, skip this step. If the user says it's a topic/index page, ask more about what the OTHER pages in the same index page are about.
[STEP 4] If user asked for a summary, generate 3 summary options and ask user to give feedback so that you can refine it. Ask whether it contains the key action or value to the reader and whether the tone fits the purpose. You can suggest to make it sound more casual and formal. If user asked for an evaluation of a summary, give them what's good, what's not, and 3 suggestions.

For your reference, these are what make a summary good:
- Say what matters most to the reader. Action? Value? As a Member of Public, why should I read your page? Summarise the key point or action. Don't storytell a policy's background or philosophy.
- The summary can't be the title repeated with no extra value-add. For example, a page titled "Our team" can't have a summary that says "Find out about our team".
- Keep it short. Aim for one sentence, max 2. Keep sentences short. Keep to 160 characters as much as possible. 160-200 is still an acceptable range. You can go up to ${maxCharacters} characters, but only if absolutely necessary.
- One of the options might have a narrative hook.
- Summaries need to end with a full stop. This helps users with assistive technologies like screen readers.
- You may include keywords that were not used in the title.

As usual, always remember to:
- use passive sentences only when necessary,
- don't use jargon,
- use British English by default,
- use proper grammar,
- keep tone light but not too friendly or casual,
- only add a full stop if you have a full sentence,
- be wary of jargons and words that mean nothing (e.g., "various"),
- write for Primary 5-level reading skills,
- HARD LIMIT: the summary must be at most ${maxCharacters} characters, and
- HARD REQUIREMENT: DO NOT ask for any additional information, generate the summary based on the information given, and if you think the information is insufficient, make assumptions based on typical Singapore government website content and generate the best possible summary you can. NEVER say "Based on the information provided, I don't have enough information to generate a good summary" or any similar statements. ALWAYS generate a summary regardless of the information given, and make assumptions where necessary.

These are examples of bad summaries:
- "Learn more about our open source products."
- "Pages in this section."
- "Stay active in your golden years with Age Well SG."

Return ONLY the summary text, nothing else.`,
        },
        {
          role: "user",
          content:
            `Here is the page content as a JSON string. ` +
            `Summarise it in at most ${maxCharacters} characters:\n\n` +
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
