import type { ButtonProps } from "~/interfaces"

// Classic Button does not use much from ButtonProps, e.g bg colour is always site's secondary colour
const Button = ({ label, href }: ButtonProps) => {
  const Label = () => (
    <span className="uppercase text-white text-center tracking-wider">
      {label}
    </span>
  )

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer nofollow" : undefined}
      type="button"
      className="px-6 py-4 bg-site-secondary"
    >
      <Label />
    </a>
  )
}

export default Button
