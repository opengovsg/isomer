import { chakra } from "@chakra-ui/react"

export const IconDelCol = chakra(
  (props: React.SVGProps<SVGSVGElement>): React.ReactNode => 
    (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path d="M2 23V1H10V23H2Z" stroke="#2C2E34" strokeWidth="1.5" />
        <path
          d="M19.45 4.7L16.97 7.18L14.5 4.7L13.67 5.53L16.15 8L13.67 10.47L14.5 11.3L16.97 8.82L19.45 11.3L20.27 10.47L17.8 8L20.27 5.53L19.45 4.7Z"
          fill="#2C2E34"
        />
      </svg>
    )
  ,
)
