import { tv } from "~/lib/tv"
import { COPYWRITING_MAPPING } from "./constants"

const createEmptyStateStyles = tv({
  slots: {
    container:
      "flex flex-col items-center justify-center gap-8 self-stretch px-10 py-20 pt-24",
    headings: "text-center",
    title: "prose-headline-lg-regular text-center",
    subtitle: "prose-headline-lg-regular mt-3 text-base-content",
    button:
      "prose-headline-base-medium text-link visited:text-link-visited hover:text-link-hover",
  },
  variants: {
    bold: {
      true: {
        title: "text-base-content-strong",
      },
      false: {
        title: "text-base-content-subtle",
      },
    },
  },
})

export const styles = createEmptyStateStyles()

interface EmptyStateProps {
  search: string
  onClick: () => void
  searchMatchType: keyof typeof COPYWRITING_MAPPING
}

export const EmptyState = ({
  search,
  onClick,
  searchMatchType,
}: EmptyStateProps) => {
  return (
    <div className={styles.container()}>
      <div className={styles.headings()}>
        <p className={styles.title({ bold: false })}>
          No search results for “
          <b className={styles.title({ bold: true })}>{search}</b>”
        </p>

        <p className={styles.subtitle()}>
          {COPYWRITING_MAPPING[searchMatchType].noResultsSubtitle}
        </p>
      </div>

      <button className={styles.button()} onClick={onClick}>
        Clear search
      </button>
    </div>
  )
}

interface FallbackEmptyStateProps {
  isLoading: boolean
  isError: boolean
}

export const FallbackEmptyState = ({
  isLoading,
  isError,
}: FallbackEmptyStateProps) => {
  let text: string
  if (isLoading) {
    text = "Loading..."
  } else if (isError) {
    text =
      "Oops! Something went wrong while loading the table. Please try again later."
  } else {
    text = "There are no items to display"
  }

  return (
    <div className={styles.container()}>
      <p className={styles.title({ bold: false })}>{text}</p>
    </div>
  )
}
