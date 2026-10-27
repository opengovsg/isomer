import { chakra } from "@chakra-ui/react"

// TODO: replace this placeholder image after Tiffy provides the final version
export const IconInfoCardsWrap = chakra(
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
        <rect x="10" y="10" width="34" height="22" rx="3" fill="#EBEBEB" />
        <rect x="53" y="10" width="34" height="22" rx="3" fill="#EBEBEB" />
        <rect x="96" y="10" width="34" height="22" rx="3" fill="#EBEBEB" />
        <rect x="10" y="40" width="34" height="22" rx="3" fill="#EBEBEB" />
        <rect x="53" y="40" width="34" height="22" rx="3" fill="#EBEBEB" />
      </svg>
    )
  },
)
