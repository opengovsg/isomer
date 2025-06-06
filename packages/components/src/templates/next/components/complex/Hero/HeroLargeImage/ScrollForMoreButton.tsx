import { tv } from "~/lib/tv"

const createScrollForMoreButtonStyles = tv({
  slots: {
    container:
      "bottom-16 left-1/2 -translate-x-1/2 animate-slide-up-fade-in rounded-full motion-reduce:animate-none",
    button:
      "z-20 flex flex-row items-center gap-0.5 rounded-full bg-black/65 px-3 py-2 text-base",
    text: "prose-headline-base-medium whitespace-nowrap text-white",
  },
  variants: {
    isFixed: {
      true: {
        container: "fixed",
        button: "animate-button-pulse motion-reduce:animate-none",
      },
      false: {
        container: "absolute",
        button: "",
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
            d="M7.3418 12.4917L14 19.1499L20.6581 12.4917L19.0085 10.8421L14 15.8506L8.99146 10.8421L7.3418 12.4917Z"
            fill="white"
          />
        </svg>
      </div>
    </div>
  )
}
