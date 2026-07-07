import { chakra } from "@chakra-ui/react"
import { useId } from "react"

interface ImageRadioIndicatorProps {
  isSelected: boolean
}

export const ImageRadioIndicator = chakra(
  ({
    isSelected,
    ...props
  }: ImageRadioIndicatorProps & React.SVGProps<SVGSVGElement>) => {
    const filterId = useId()

    if (isSelected) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          {...props}
        >
          <g filter={`url(#${filterId})`}>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M14 22.3333C18.6024 22.3333 22.3333 18.6024 22.3333 14C22.3333 9.39763 18.6024 5.66667 14 5.66667C9.39763 5.66667 5.66667 9.39763 5.66667 14C5.66667 18.6024 9.39763 22.3333 14 22.3333ZM14 24C19.5228 24 24 19.5228 24 14C24 8.47715 19.5228 4 14 4C8.47715 4 4 8.47715 4 14C4 19.5228 8.47715 24 14 24Z"
              fill="#1361F0"
            />
            <path
              d="M20.6667 14C20.6667 17.6819 17.6819 20.6667 14 20.6667C10.3181 20.6667 7.33333 17.6819 7.33333 14C7.33333 10.3181 10.3181 7.33333 14 7.33333C17.6819 7.33333 20.6667 10.3181 20.6667 14Z"
              fill="#1361F0"
            />
          </g>
          <defs>
            <filter
              id={filterId}
              x="0"
              y="0"
              width="28"
              height="28"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha"
              />
              <feOffset />
              <feGaussianBlur stdDeviation="2" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.736206 0 0 0 0 0.794272 0 0 0 0 0.932665 0 0 0 0.41 0"
              />
              <feBlend
                mode="normal"
                in2="BackgroundImageFix"
                result="effect1_dropShadow"
              />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="effect1_dropShadow"
                result="shape"
              />
            </filter>
          </defs>
        </svg>
      )
    }

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        {...props}
      >
        <g filter={`url(#${filterId})`}>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M14 22.3333C18.6024 22.3333 22.3333 18.6024 22.3333 14C22.3333 9.39763 18.6024 5.66667 14 5.66667C9.39763 5.66667 5.66667 9.39763 5.66667 14C5.66667 18.6024 9.39763 22.3333 14 22.3333ZM14 24C19.5228 24 24 19.5228 24 14C24 8.47715 19.5228 4 14 4C8.47715 4 4 8.47715 4 14C4 19.5228 8.47715 24 14 24Z"
            fill="#2C2E34"
          />
        </g>
        <defs>
          <filter
            id={filterId}
            x="0"
            y="0"
            width="28"
            height="28"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset />
            <feGaussianBlur stdDeviation="2" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.736206 0 0 0 0 0.794272 0 0 0 0 0.932665 0 0 0 0.41 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow"
              result="shape"
            />
          </filter>
        </defs>
      </svg>
    )
  },
)
