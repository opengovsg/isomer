import { chakra } from "@chakra-ui/react"

export const IconHeroActionLayoutButtons = chakra(
  (props: React.SVGProps<SVGSVGElement>) => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="103"
        height="62"
        viewBox="0 0 103 62"
        fill="none"
        {...props}
      >
        <g clipPath="url(#heroActionLayoutButtonsClip)">
          <rect
            x="0.5"
            y="0.5"
            width="102"
            height="61"
            rx="3.5"
            fill="white"
            stroke="#E5E5E5"
          />
          <rect x="8" y="12" width="45" height="7" rx="2" fill="#EBEBEB" />
          <rect x="8" y="23" width="69" height="7" rx="2" fill="#EBEBEB" />
          <rect
            x="8"
            y="51"
            width="10"
            height="23"
            rx="2"
            transform="rotate(-90 8 51)"
            fill="#CECECE"
          />
          <rect
            x="35"
            y="51"
            width="10"
            height="23"
            rx="2"
            transform="rotate(-90 35 51)"
            fill="#EBEBEB"
          />
        </g>
        <defs>
          <clipPath id="heroActionLayoutButtonsClip">
            <rect width="103" height="62" fill="white" />
          </clipPath>
        </defs>
      </svg>
    )
  },
)
