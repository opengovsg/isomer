import { chakra } from "@chakra-ui/react"

export const IconOneColumnLayout = chakra(
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
        <rect x="0.5" y="0.5" width="104" height="63" rx="4.5" fill="white" />
        <rect
          x="0.5"
          y="0.5"
          width="104"
          height="63"
          rx="4.5"
          stroke="#E5E5E5"
        />
        <g clipPath="url(#clip0_18559_60749)">
          <rect x="1" y="1" width="103" height="62" rx="4" fill="white" />
          <rect x="30" y="7" width="65" height="14" rx="2" fill="#EBEBEB" />
          <rect x="30" y="25" width="65" height="14" rx="2" fill="#EBEBEB" />
          <rect x="30" y="43" width="65" height="14" rx="2" fill="#EBEBEB" />
          <rect x="30" y="61" width="65" height="14" rx="2" fill="#EBEBEB" />
        </g>
        <rect x="7" y="7" width="15" height="33" rx="2" fill="#EBEBEB" />
        <defs>
          <clipPath id="clip0_18559_60749">
            <rect
              width="103"
              height="62"
              fill="white"
              transform="translate(1 1)"
            />
          </clipPath>
        </defs>
      </svg>
    )
  },
)
