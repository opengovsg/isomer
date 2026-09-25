import { trpc } from "~/utils/trpc"

// The mutation is the only store. A successful call can still come back
// without text when the image cannot be read or the model returns nothing.
export const useAltTextSuggestion = () => {
  const { mutate, reset, isPending, isSuccess, isError, data } =
    trpc.ai.generateAltText.useMutation()

  const suggestion = isSuccess ? data?.altText : undefined

  return {
    isGenerating: isPending,
    suggestion,
    hasFailed: isError || (isSuccess && !suggestion),
    generate: mutate,
    dismiss: reset,
  }
}
