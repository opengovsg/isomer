import { HeadingProps } from "~/common"

const Heading = ({ content, level }: HeadingProps) => {
  if (level === 1) {
    return (
      <h1 className="text-[2.75rem] leading-[3.25rem] lg:text-[3.75rem] lg:leading-[4rem] font-semibold text-content tracking-[-0.022em]">
        {content}
      </h1>
    )
  }
  if (level === 2) {
    return (
      <h2 className="text-[2.375rem] leading-[2.75rem] lg:text-[3rem] lg:leading-[3.625rem] font-semibold text-content tracking[-0.022em]">
        {content}
      </h2>
    )
  }
  if (level === 3) {
    return (
      <h3 className="text-[1.625rem] leading-[2rem] lg:text-[2.25rem] lg:leading-[3rem] font-semibold text-content tracking-[-0.022em]">
        {content}
      </h3>
    )
  }
  if (level === 4) {
    return (
      <h4 className="text-[1.125rem] leading-[1.5rem] lg:text-[1.5rem] lg:leading-[2.25rem] font-semibold text-content">
        {content}
      </h4>
    )
  }
  if (level === 5) {
    return (
      <h5 className="text-[1.125rem] leading-[1.5rem] lg:text-[1.25rem] lg:leading-[1.5rem] font-semibold text-content">
        {content}
      </h5>
    )
  }
  return (
    <h6 className="text-[1.125rem] leading-[1.5rem] font-medium text-content tracking-[0.05em] uppercase">
      {content}
    </h6>
  )
}

export default Heading
