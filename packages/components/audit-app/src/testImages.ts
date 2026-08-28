export interface TestImage {
  key: string
  label: string
  src: string
  alt: string
  w: number
  h: number
}

export const TEST_IMAGES: TestImage[] = [
  {
    key: "wide",
    label: "Very wide (5:1)",
    src: "/testimg/wide.svg",
    alt: "Diagnostic test image, 5 to 1 wide",
    w: 3000,
    h: 600,
  },
  {
    key: "tall",
    label: "Very tall (1:5)",
    src: "/testimg/tall.svg",
    alt: "Diagnostic test image, 1 to 5 tall",
    w: 600,
    h: 3000,
  },
  {
    key: "landscape",
    label: "Sane landscape (3:2)",
    src: "/testimg/landscape.svg",
    alt: "Diagnostic test image, 3 to 2 landscape",
    w: 1500,
    h: 1000,
  },
  {
    key: "portrait",
    label: "Sane portrait (3:4)",
    src: "/testimg/portrait.svg",
    alt: "Diagnostic test image, 3 to 4 portrait",
    w: 900,
    h: 1200,
  },
]

export const DEFAULT_IMAGE_KEY = "landscape"

export const getTestImage = (key: string | null): TestImage =>
  TEST_IMAGES.find((i) => i.key === key) ??
  TEST_IMAGES.find((i) => i.key === DEFAULT_IMAGE_KEY)!
