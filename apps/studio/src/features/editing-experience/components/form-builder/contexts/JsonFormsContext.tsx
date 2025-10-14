import { ComponentType, memo } from "react"
import { ControlWithDetailProps } from "@jsonforms/core"
import {
  ctxDispatchToControlProps,
  ctxToControlWithDetailProps,
  JsonFormsStateContext,
  withJsonFormsContext,
} from "@jsonforms/react"

export const withJsonFormsControlWithDetailProps = (
  Component: ComponentType<ControlWithDetailProps>,
) => {
  return withJsonFormsContext(
    withContextToControlWithDetailProps(memo(Component)),
  )
}

// NOTE: This is a custom handrolled higher order component.
// It is needed to provide both `uischemas` as well as the `handleChange` prop.
// The implementation here is taken with reference from:
// https://github.com/eclipsesource/jsonforms/blob/f815e1cde8794380d59e55c34beff17cf0ffb565/packages/react/src/JsonFormsContext.tsx
const withContextToControlWithDetailProps = (
  Component: ComponentType<ControlWithDetailProps>,
) =>
  function WithContextToControlProps({
    ctx,
    props,
  }: JsonFormsStateContext & ControlWithDetailProps) {
    // NOTE: provides `handleChange` for our method.
    // Unfortunately, the `ctx` is typed as `any` here
    // and requires suppression.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const dispatchProps = ctxDispatchToControlProps(ctx.dispatch)
    // NOTE: provides `uischemas, renderers, cells`
    // The previous implementation of using `withJsonFormsDetailProps`
    // only provided this.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const detailProps = ctxToControlWithDetailProps(ctx, props)
    return <Component {...props} {...dispatchProps} {...detailProps} />
  }
