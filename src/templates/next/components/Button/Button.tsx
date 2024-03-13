import { ButtonProps } from "~/common"
import { NextButtonColorVariant, SUPPORTED_ICONS_MAP } from "~/common/Button"

const colorVariantToClassMap: Record<NextButtonColorVariant, string> = {
  black: "bg-[#333333] text-white",
  white: "bg-white text-[#333333]",
}

const Button = ({ label, colorVariant, href, rightIcon }: ButtonProps) => {
  const Label = () => (
    <span className="text-center text-lg font-semibold leading-tight">
      {label}
    </span>
  )

  const RightIcon = () => {
    if (!rightIcon) {
      return null
    }
    const Icon = SUPPORTED_ICONS_MAP[rightIcon]
    return (
      <div>
        <Icon className="size-6" />
      </div>
    )
  }

  const colorVariantClass = colorVariantToClassMap[colorVariant ?? "black"]

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer nofollow" : undefined}
      type="button"
      className={`${colorVariantClass} inline-flex items-center gap-1 px-5 py-4 w-fit`}
    >
      <Label />
      <RightIcon />
    </a>
  )
}

export default Button
