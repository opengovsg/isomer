import { trpc } from "~/utils/trpc"

// Failures are mutation errors. A success always carries the suggestion text.
export const useAltTextSuggestion = () => {
  const { mutate, reset, isPending, isSuccess, isError, data } =
    trpc.ai.generateAltText.useMutation()

  return {
    isGenerating: isPending,
    suggestion: isSuccess ? data.altText : undefined,
    hasFailed: isError,
    generate: mutate,
    dismiss: reset,
  }
}
