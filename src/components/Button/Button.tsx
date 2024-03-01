export interface ButtonProps {
  label: string
  href: string
  buttonColour?: string
  textColour?: string
  rounded?: boolean
  openInNewTab?: boolean
}

const isExternalLink = (href: string) => {
  return !href.startsWith("/")
}

const Button = ({
  label,
  buttonColour,
  textColour,
  rounded,
  href,
  openInNewTab,
}: ButtonProps) => {
  const buttonColourClass = `bg-${buttonColour ?? "secondary"}`
  const textColourClass = `text-${textColour ?? "white"}`
  const roundedClass = rounded ? "rounded" : ""
  const className = `${buttonColourClass} ${textColourClass} ${roundedClass} px-6 py-2`

  return (
    <a
      href={href}
      target={openInNewTab ? "_blank" : undefined}
      rel={isExternalLink(href) ? "noopener noreferrer nofollow" : undefined}
      type="button"
      className={className}
    >
      {label}
    </a>
  )
}

export default Button
