import { chakra } from "@chakra-ui/react"

// TODO: replace this placeholder image after Tiffy provides the final version
export const IconInfoCardsCarousel = chakra(
  (props: React.SVGProps<SVGSVGElement>) => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="103"
        height="53"
        viewBox="0 0 140 72"
        fill="none"
        aria-hidden
        {...props}
      >
        <rect
          x="0.5"
          y="0.5"
          width="139"
          height="71"
          rx="4"
          fill="white"
          stroke="#E5E5E5"
        />
        <rect x="10" y="22" width="34" height="28" rx="3" fill="#EBEBEB" />
        <rect x="50" y="22" width="34" height="28" rx="3" fill="#EBEBEB" />
        <rect x="90" y="22" width="16" height="28" rx="3" fill="#EBEBEB" />
        <path
          d="M116 30L124 36L116 42"
          stroke="#666C7A"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  },
)
