import { tv } from "~/lib/tv"

const dotStyles = tv({
  base: "block h-2.5 w-2.5 rounded-full bg-brand-canvas transition-[width,background-color] duration-300 ease-out motion-reduce:transition-none",
  variants: {
    isActive: {
      true: "w-7 bg-brand-canvas-inverse",
    },
  },
})

interface NavigationDotsProps {
  pages: number
  pageIndex: number
  goToPage: (index: number) => void
}

export const NavigationDots = ({
  pages,
  pageIndex,
  goToPage,
}: NavigationDotsProps) => {
  return (
    <div className="flex items-center">
      {Array.from({ length: pages }, (_, index) => {
        const isActive = index === pageIndex
        return (
          <button
            key={index}
            type="button"
            aria-label={`Go to page ${index + 1} of ${pages}`}
            aria-current={isActive ? "true" : undefined}
            className="flex h-6 shrink-0 items-center px-2 focus-visible:bg-utility-highlight focus-visible:shadow-focus-visible focus-visible:outline-0"
            onClick={() => goToPage(index)}
          >
            <span className={dotStyles({ isActive })} />
          </button>
        )
      })}
    </div>
  )
}
