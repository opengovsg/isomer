import type { FieldValues, UseFormProps } from "react-hook-form"
import type { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

export const useZodForm = <TSchema extends z.ZodType<unknown, FieldValues>>(
  props: Omit<UseFormProps<TSchema["_input"]>, "resolver"> & {
    schema: TSchema
  },
) => {
  const form = useForm<TSchema["_input"], unknown, TSchema["_output"]>({
    ...props,
    // Zod v4's zodResolver returns Resolver<z.input<T>, ...> (conditional type) while useForm
    // expects Resolver<T["_input"], ...> (property access). They resolve to the same type but
    // TypeScript cannot prove equivalence across these two type-level representations.
    resolver: zodResolver(props.schema),
  })

  return form
}
