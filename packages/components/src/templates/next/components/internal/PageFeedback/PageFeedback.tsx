"use client"

import { useId, useRef, useState } from "react"
import { BiDislike, BiLike } from "react-icons/bi"

import type { PageFeedbackProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { Button } from "../Button"
import { ComponentContent } from "../customCssClass"

const createPageFeedbackStyles = tv({
  slots: {
    container: "flex flex-col items-center gap-4",
    question: "prose-headline-lg-medium text-base-content",
    buttonGroup: "flex gap-3",
    thankYouMessage: "prose-body-base text-base-content-medium",
    contentContainer: "flex flex-col items-center gap-4",
  },
  variants: {
    layout: {
      article: {
        container: "pb-12 pt-16",
      },
      content: {
        container: "py-8",
      },
    },
  },
  defaultVariants: {
    layout: "content",
  },
})

export const PageFeedback = ({
  apiEndpoint,
  layout,
  permalink,
}: PageFeedbackProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const questionId = useId()
  const thankYouRef = useRef<HTMLDivElement>(null)

  const handleFeedback = ({ isHelpful }: { isHelpful: boolean }) => {
    setIsSubmitted(true)

    // Fire the API call in the background (fire and forget)
    fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isHelpful,
        permalink,
        timestamp: new Date().toISOString(),
        hostname: typeof window !== "undefined" ? window.location.hostname : "",
      }),
    })
      .then(() => {
        // Move focus to thank you message for screen reader users
        setTimeout(() => {
          thankYouRef.current?.focus()
        }, 100)
      })
      .catch((error) => {
        // Silently handle errors in the background
        console.error("Error submitting feedback:", error)
      })
  }

  const styles = createPageFeedbackStyles({
    layout: layout === "article" ? "article" : "content",
  })

  return (
    <section className={ComponentContent} aria-label="Page feedback">
      <div className={styles.container()}>
        {isSubmitted ? (
          <div
            ref={thankYouRef}
            className={styles.contentContainer()}
            aria-live="polite"
            tabIndex={-1}
          >
            <p className={styles.thankYouMessage()}>
              Thank you for your feedback!
            </p>
          </div>
        ) : (
          <div className={styles.contentContainer()}>
            <p id={questionId} className={styles.question()}>
              Is this page helpful?
            </p>
            <div
              className={styles.buttonGroup()}
              role="group"
              aria-labelledby={questionId}
            >
              <Button
                onPress={() => handleFeedback({ isHelpful: true })}
                variant="outline"
                size="base"
                isDisabled={isSubmitted}
                aria-label="Yes, this page is helpful"
              >
                <BiLike aria-hidden="true" className="mr-2 h-5 w-5" />
                Yes
              </Button>
              <Button
                onPress={() => handleFeedback({ isHelpful: false })}
                variant="outline"
                size="base"
                isDisabled={isSubmitted}
                aria-label="No, this page is not helpful"
              >
                <BiDislike aria-hidden="true" className="mr-2 h-5 w-5" />
                No
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
