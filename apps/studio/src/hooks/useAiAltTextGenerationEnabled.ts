import { useFeatureValue } from "@growthbook/growthbook-react"
import {
  ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY,
  ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY_FALLBACK_VALUE,
  isAiAltTextGenerationEnabledForSite,
  type AiAltTextGenerationFeatureValue,
} from "~/lib/growthbook"

export const useAiAltTextGenerationEnabled = (siteId: number) => {
  const value = useFeatureValue<AiAltTextGenerationFeatureValue>(
    ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY,
    ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY_FALLBACK_VALUE,
  )
  return isAiAltTextGenerationEnabledForSite({ value, siteId })
}
