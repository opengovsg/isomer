import type { InputProps } from "react-aria-components"
import { Input as AriaInput, composeRenderProps } from "react-aria-components"

import { tv } from "~/lib/tv"

export const inputStyles = tv({
  base: "prose-body-base min-w-0 flex-1 bg-white text-base-content outline outline-0 placeholder:text-interaction-support-placeholder disabled:text-interaction-support-placeholder",
})

export function Input(props: InputProps) {
  return (
    <AriaInput
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        inputStyles({ ...renderProps, className }),
      )}
    />
  )
}
