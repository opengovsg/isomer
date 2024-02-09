interface HomepageSectionWrapperProps {
  sectionIndex?: number
  children: JSX.Element | JSX.Element[]
}

export const HomepageSectionWrapper = ({
  sectionIndex,
  children,
  ...rest
}: HomepageSectionWrapperProps) => {
  return (
    <div
      className={
        sectionIndex && sectionIndex % 2 === 0 ? "bg-white" : "bg-gray-100"
      }
      {...rest}
    >
      {children}
    </div>
  )
}
