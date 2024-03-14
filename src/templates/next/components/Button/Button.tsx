import { ButtonProps } from "~/common"
import { ButtonColorScheme } from "~/common/Button"
import { SUPPORTED_ICONS_MAP } from "~/common/Icons"

const Label = ({ label }: Pick<ButtonProps, "label">) => (
  <span className="text-center text-lg font-semibold leading-tight">
    {label}
  </span>
)

const RightIcon = ({ rightIcon }: Pick<ButtonProps, "rightIcon">) => {
  if (!rightIcon) {
    return null
  }
  const Icon = SUPPORTED_ICONS_MAP[rightIcon]
  return <Icon className="min-w-6 h-auto" />
}

const BaseButton = ({
  label,
  href,
  rightIcon,
  className = "",
  isLinkVariant = false,
}: ButtonProps & { className?: string; isLinkVariant?: boolean }) => {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer nofollow" : undefined}
      type="button"
      className={`${className} w-fit inline-flex items-center gap-1 ${
        isLinkVariant ? "" : "px-5 py-4"
      } active:underline active:underline-offset-2`}
    >
      <Label label={label} />
      <RightIcon rightIcon={rightIcon} />
    </a>
  )
}

const SolidButton = (props: ButtonProps) => {
  const colorSchemeClassMap: Record<ButtonColorScheme, string> = {
    white: "bg-white hover:bg-secondary text-content-default",
    black: "bg-content-default hover:bg-secondary text-white",
  }
  return (
    <BaseButton
      {...props}
      className={colorSchemeClassMap[props.colorScheme ?? "black"]}
    />
  )
}

const OutlineButton = (props: ButtonProps) => {
  const colorSchemeClassMap: Record<ButtonColorScheme, string> = {
    white: "text-white border border-white",
    black: "text-content-default border border-content-default",
  }

  return (
    <BaseButton
      {...props}
      className={`${
        colorSchemeClassMap[props.colorScheme ?? "black"]
      } bg-transparent hover:bg-secondary/50`}
    />
  )
}

const GhostButton = (props: ButtonProps) => {
  const colorSchemeClassMap: Record<ButtonColorScheme, string> = {
    white: "text-white",
    black: "text-content-default",
  }

  return (
    <BaseButton
      {...props}
      className={`${
        colorSchemeClassMap[props.colorScheme ?? "black"]
      } bg-transparent hover:bg-secondary/50`}
    />
  )
}

const LinkButton = (props: ButtonProps) => {
  const colorSchemeClassMap: Record<ButtonColorScheme, string> = {
    white: "text-white",
    black: "text-content-default",
  }

  return (
    <BaseButton
      {...props}
      className={`${
        colorSchemeClassMap[props.colorScheme ?? "black"]
      } hover:underline hover:underline-offset-2`}
      isLinkVariant
    />
  )
}

const Button = (props: ButtonProps) => {
  if (props.variant === "outline") {
    return <OutlineButton {...props} />
  } else if (props.variant === "ghost") {
    return <GhostButton {...props} />
  } else if (props.variant === "link") {
    return <LinkButton {...props} />
  }
  return <SolidButton {...props} />
}


export default Button
