import { Box } from "@chakra-ui/react"

export interface InfopicProps {
  sectionIndex: number
  title?: string
  subtitle?: string
  description?: string
  alt?: string
  image?: string
  button?: string
  url?: string
}

export const Infopic = ({
  sectionIndex,
  title,
  subtitle,
  description,
  alt,
  image,
  button,
  url
}: InfopicProps): JSX.Element => {
  return <Box>
    {title}
  </Box>
}