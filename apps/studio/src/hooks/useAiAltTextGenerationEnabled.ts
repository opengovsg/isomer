import { useFeatureValue } from "@growthbook/growthbook-react"
import {
  ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY,
  ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY_FALLBACK_VALUE,
} from "~/lib/growthbook"

export const useAiAltTextGenerationEnabled = () =>
  useFeatureValue<boolean>(
    ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY,
    ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY_FALLBACK_VALUE,
  )
