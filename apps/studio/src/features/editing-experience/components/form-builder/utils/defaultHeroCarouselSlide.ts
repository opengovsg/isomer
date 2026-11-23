import { PLACEHOLDER_IMAGE_FILENAME } from "../../constants"

export function defaultHeroCarouselSlide({
  backgroundUrl,
}: { backgroundUrl?: string } = {}) {
  return {
    backgroundUrl: backgroundUrl || `/${PLACEHOLDER_IMAGE_FILENAME}`,
    title: "Enter a title.",
  }
}
