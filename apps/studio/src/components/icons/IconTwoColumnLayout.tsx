import { chakra } from "@chakra-ui/react"

export const IconTwoColumnLayout = chakra(
  (props: React.SVGProps<SVGSVGElement>) => {
    return (
      <svg
        width="105"
        height="64"
        viewBox="0 0 105 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <g clipPath="url(#clip0_18559_60735)">
          <rect x="1" y="1" width="103" height="62" rx="4" fill="white" />
          <rect x="1" y="1" width="103" height="62" rx="4" fill="white" />
          <rect x="31" y="7" width="30" height="20" rx="2" fill="#EBEBEB" />
          <rect x="7" y="7" width="15" height="33" rx="2" fill="#EBEBEB" />
          <rect x="66" y="7" width="30" height="20" rx="2" fill="#EBEBEB" />
          <rect x="31" y="31" width="30" height="20" rx="2" fill="#EBEBEB" />
          <rect x="66" y="31" width="30" height="20" rx="2" fill="#EBEBEB" />
          <rect x="31" y="54" width="30" height="20" rx="2" fill="#EBEBEB" />
          <rect x="66" y="54" width="30" height="20" rx="2" fill="#EBEBEB" />
        </g>
        <rect
          x="0.5"
          y="0.5"
          width="104"
          height="63"
          rx="4.5"
          stroke="#E5E5E5"
        />
        <defs>
          <clipPath id="clip0_18559_60735">
            <rect x="1" y="1" width="103" height="62" rx="4" fill="white" />
          </clipPath>
        </defs>
      </svg>
    )
  },
)
