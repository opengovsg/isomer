export type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

// Clamped so a heading level computed from deep nesting never produces an
// invalid tag — HTML only defines h1 through h6.
export const getHeadingTag = (level: number): HeadingTag => {
  const clamped = Math.min(Math.max(Math.round(level), 1), 6)
  return `h${clamped}` as HeadingTag
}
