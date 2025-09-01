import { compoundStyles } from "./common"

interface EmptyStateProps {
  isLoading: boolean
  isError: boolean
}

export const EmptyState = ({ isLoading, isError }: EmptyStateProps) => {
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
    <div className={compoundStyles.emptyState()}>
      <p className={compoundStyles.emptyStateTitle()}>{text}</p>
    </div>
  )
}
