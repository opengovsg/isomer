import { tv } from "~/lib/tv"

const createScrollForMoreButtonStyles = tv({
  slots: {
    button:
      "z-20 flex flex-row items-center gap-0.5 rounded-full bg-black/65 px-3 py-2 text-base",
    container:
      "bottom-16 left-1/2 -translate-x-1/2 animate-slide-up-fade-in rounded-full motion-reduce:animate-none",
    text: "prose-headline-base-medium whitespace-nowrap text-white",
  },
  variants: {
    isFixed: {
      false: {
        button: "",
        container: "absolute",
      },
      true: {
        button: "animate-button-pulse motion-reduce:animate-none",
        container: "fixed",
      },
    },
  },
})

interface ScrollForMoreButtonProps {
  isFixed: boolean
}

export const ScrollForMoreButton = ({ isFixed }: ScrollForMoreButtonProps) => {
  const styles = createScrollForMoreButtonStyles({ isFixed })

  return (
    <div className={styles.container()}>
      <div className={styles.button()}>
        <span className={styles.text()}>Scroll for more</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
        >
          <path
            d="M7.34 12.49L14 19.15L20.66 12.49L19.01 10.84L14 15.85L8.99 10.84L7.34 12.49Z"
            fill="white"
          />
        </svg>
      </div>
    </div>
  )
}
