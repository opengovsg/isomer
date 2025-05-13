interface ScrollForMoreButtonProps {
  isFixed: boolean
}

export const ScrollForMoreButton = ({ isFixed }: ScrollForMoreButtonProps) => {
  return (
    <div
      className={`${
        isFixed ? "animate-button-pulse fixed" : "absolute"
      } animate-slide-up-fade-in bottom-16 left-1/2 z-20 flex -translate-x-1/2 flex-row items-center gap-0.5 rounded-full bg-black/65 px-3 py-2 text-base`}
    >
      <span className="prose-headline-base-medium whitespace-nowrap text-white">
        Scroll for more
      </span>
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
  )
}
