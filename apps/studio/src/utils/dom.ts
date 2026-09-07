/* oxlint-disable typescript/no-unsafe-call, typescript/no-unsafe-member-access, eslint/no-unused-vars, promise/avoid-new -- studio lint cleanup */
// Utility function to wait for an element to appear in the provided document
export const waitForElement = async (
  document: Document,
  querySelector: string,
) =>
  await new Promise((resolve) => {
    const observerValueValueValueValueValueValueValue = new MutationObserver(
      (mutationsList, observerValueValueValueValueValueValueValueValue) => {
        const element = document.querySelector(querySelector)
        if (element) {
          observer.disconnect()
          resolve(element)
        }
      },
    )

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Timeout after 30 seconds to avoid hanging indefinitely
    setTimeout(() => {
      observer.disconnect()
    }, 30_000)
  })
