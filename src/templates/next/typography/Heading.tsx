export const Heading = {
  1: "text-[2.75rem] leading-[3.25rem] lg:text-[3.75rem] lg:leading-[4rem] font-semibold tracking-[-0.022em]",
  2: "text-[2.375rem] leading-[2.75rem] lg:text-[3rem] lg:leading-[3.625rem] font-semibold tracking[-0.022em]",
  3: "text-[1.625rem] leading-[2rem] lg:text-[2.25rem] lg:leading-[3rem] font-semibold tracking-[-0.022em]",
  4: "text-[1.125rem] leading-[1.5rem] lg:text-[1.5rem] lg:leading-[2.25rem] font-semibold",
  "4-medium":
    "text-[1.125rem] leading-[1.5rem] lg:text-[1.5rem] lg:leading-[2.25rem] font-medium",
  5: "text-[1.125rem] leading-[1.5rem] lg:text-[1.25rem] lg:leading-[1.5rem] font-semibold",
  6: "text-[1.125rem] leading-[1.5rem] font-medium tracking-[0.05em] uppercase",
}

type HeadingSize = keyof typeof Heading

export const getHeadingStyles = (
  headingSize: HeadingSize,
  breakpoint: string,
) => {
  switch (headingSize) {
    case 1:
      return `text-[2.75rem] leading-[3.25rem] ${breakpoint}:text-[3.75rem] ${breakpoint}:leading-[4rem] font-semibold tracking-[-0.022em]`
    case 2:
      return `text-[2.375rem] leading-[2.75rem] ${breakpoint}:text-[3rem] ${breakpoint}:leading-[3.625rem] font-semibold tracking[-0.022em]`
    case 3:
      return `text-[1.625rem] leading-[2rem] ${breakpoint}:text-[2.25rem] ${breakpoint}:leading-[3rem] font-semibold tracking-[-0.022em]`
    case 4:
      return `text-[1.125rem] leading-[1.5rem] ${breakpoint}:text-[1.5rem] ${breakpoint}:leading-[2.25rem] font-semibold`
    case 5:
      return `text-[1.125rem] leading-[1.5rem] ${breakpoint}:text-[1.25rem] ${breakpoint}:leading-[1.5rem] font-semibold`
    case 6:
      return `text-[1.125rem] leading-[1.5rem] font-medium tracking-[0.05em] uppercase`
  }
}
