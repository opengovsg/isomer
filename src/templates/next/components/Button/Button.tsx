import { ButtonProps } from "~/common"
import { NextButtonTextColors } from "~/common/Button"
import { SUPPORTED_ICONS_MAP } from "~/common/Icons"

const colorClassMap: Record<NextButtonTextColors, string> = {
  white: "text-white",
  black: "text-content-default",
}
const borderColorClassMap: Record<NextButtonTextColors, string> = {
  white: "border-white",
  black: "border-content-default",
}
const textColorToBgColorMap: Record<NextButtonTextColors, string> = {
  white: "bg-content-default hover:bg-secondary",
  black: "bg-white hover:bg-secondary",
}

const Button = ({
  label,
  href,
  clear,
  textColor,
  outlined,
  rightIcon,
}: ButtonProps) => {
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

  const textColorClass = colorClassMap[textColor ?? "white"]
  const bgColorClass = clear
    ? "bg-transparent hover:bg-secondary/50"
    : textColorToBgColorMap[textColor ?? "white"]

  const borderColor = borderColorClassMap[textColor ?? "white"]
  const outlinedClass = outlined ? `border ${borderColor}` : ""

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer nofollow" : undefined}
      type="button"
      className={`${textColorClass} ${bgColorClass} ${outlinedClass} w-fit inline-flex items-center gap-1 px-5 py-4 active:underline active:underline-offset-2`}
    >
      <Label />
      <RightIcon />
    </a>
  )
}

export default Button
