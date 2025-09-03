// Utility function to wait for an element to appear in the provided document
export const waitForElement = async (
  document: Document,
  querySelector: string,
) => {
  return new Promise((resolve) => {
    const observer = new MutationObserver((mutationsList, observer) => {
      const element = document.querySelector(querySelector)
      if (element) {
        observer.disconnect()
        resolve(element)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Timeout after 30 seconds to avoid hanging indefinitely
    setTimeout(() => {
      observer.disconnect()
    }, 30000)
  })
}
