import type { ButtonProps } from "~/interfaces"
import type { ButtonColorScheme } from "~/interfaces/complex/Button"
import { SUPPORTED_ICONS_MAP } from "~/common/icons"

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
  LinkComponent = "a",
}: Omit<ButtonProps, "type"> & {
  className?: string
  isLinkVariant?: boolean
}) => {
  return (
    <LinkComponent
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer nofollow" : undefined}
      type="button"
      className={`${className} w-fit inline-flex items-center gap-1 ${
        isLinkVariant ? "h-fit" : "px-5 py-4"
      } active:underline active:underline-offset-2`}
    >
      <Label label={label} />
      <RightIcon rightIcon={rightIcon} />
    </LinkComponent>
  )
}

const SolidButton = (props: Omit<ButtonProps, "type">) => {
  const colorSchemeClassMap: Record<ButtonColorScheme, string> = {
    white: "bg-content-inverse text-content",
    black: "bg-interaction-main text-content-inverse",
  }
  return (
    <BaseButton
      {...props}
      className={`${
        colorSchemeClassMap[props.colorScheme ?? "black"]
      } hover:bg-interaction-main-hover active:bg-interaction-main-active`}
    />
  )
}

const OutlineButton = (props: Omit<ButtonProps, "type">) => {
  const colorSchemeClassMap: Record<ButtonColorScheme, string> = {
    white: "text-content-inverse border-content-inverse",
    black: "text-content border-interaction-main",
  }

  return (
    <BaseButton
      {...props}
      className={`${
        colorSchemeClassMap[props.colorScheme ?? "black"]
      } bg-transparent border hover:bg-site-primary-100`}
    />
  )
}

const GhostButton = (props: Omit<ButtonProps, "type">) => {
  const colorSchemeClassMap: Record<ButtonColorScheme, string> = {
    white: "text-content-inverse",
    black: "text-content",
  }

  return (
    <BaseButton
      {...props}
      className={`${
        colorSchemeClassMap[props.colorScheme ?? "black"]
      } bg-transparent hover:bg-site-primary-100`}
    />
  )
}

const LinkButton = (props: Omit<ButtonProps, "type">) => {
  const colorSchemeClassMap: Record<ButtonColorScheme, string> = {
    white: "text-content-inverse",
    black: "text-content",
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

const Button = (props: Omit<ButtonProps, "type">) => {
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
