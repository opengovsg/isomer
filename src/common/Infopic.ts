export interface InfopicProps {
  type: "infopic"
  sectionIndex?: number
  title: string
  subtitle?: string
  description?: string
  imageAlt?: string
  imageSrc: string
  buttonLabel?: string
  buttonUrl?: string
  isTextOnRight?: boolean
  variant?: "side-by-side" | "side-part"
}

export default InfopicProps
