"use client"

import { useId, useState } from "react"
import { BiDislike, BiLike } from "react-icons/bi"

import type { PageFeedbackProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { Button } from "../Button"
import { ComponentContent } from "../customCssClass"

const createPageFeedbackStyles = tv({
  slots: {
    container: "relative flex flex-col items-center gap-4",
    question: "prose-headline-lg-medium text-base-content",
    buttonGroup: "flex gap-3",
    thankYouMessage: "prose-body-base text-base-content-medium",
    questionContainer:
      "flex flex-col items-center gap-4 transition-opacity duration-300 ease-out motion-reduce:transition-none",
    thankYouContainer:
      "flex flex-col items-center gap-4 transition-opacity duration-300 ease-out motion-reduce:transition-none",
  },
  variants: {
    isSubmitted: {
      true: {
        questionContainer: "pointer-events-none absolute opacity-0",
        thankYouContainer: "pointer-events-auto relative opacity-100",
      },
      false: {
        questionContainer: "pointer-events-auto relative opacity-100",
        thankYouContainer: "pointer-events-none absolute opacity-0",
      },
    },
    layout: {
      article: {
        container: "pb-12 pt-16",
      },
      content: {
        container: "py-8",
      },
      default: {
        container: "py-8",
      },
    },
  },
  defaultVariants: {
    layout: "default",
  },
})

export const PageFeedback = ({ apiEndpoint, layout }: PageFeedbackProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const questionId = useId()

  const handleFeedback = ({ isHelpful }: { isHelpful: boolean }) => {
    // Optimistically show success state immediately
    setIsSubmitted(true)

    // Fire the API call in the background (fire and forget)
    if (apiEndpoint) {
      fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isHelpful }),
      }).catch((error) => {
        // Silently handle errors in the background
        console.error("Error submitting feedback:", error)
      })
    }
  }

  const styles = createPageFeedbackStyles({
    isSubmitted,
    layout:
      layout === "article"
        ? "article"
        : layout === "content"
          ? "content"
          : "default",
  })

  return (
    <section className={ComponentContent} aria-label="Page feedback">
      <div className={styles.container()}>
        <div
          className={styles.questionContainer()}
          aria-hidden={isSubmitted}
        >
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
            >
              <BiLike aria-hidden="true" className="mr-2 h-5 w-5" />
              Yes
            </Button>
            <Button
              onPress={() => handleFeedback({ isHelpful: false })}
              variant="outline"
              size="base"
            >
              <BiDislike aria-hidden="true" className="mr-2 h-5 w-5" />
              No
            </Button>
          </div>
        </div>
        <div
          className={styles.thankYouContainer()}
          aria-hidden={!isSubmitted}
          aria-live="polite"
        >
          <p className={styles.thankYouMessage()}>
            Thank you for your feedback!
          </p>
        </div>
      </div>
    </section>
  )
}
