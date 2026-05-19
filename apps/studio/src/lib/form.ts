import type { FieldValues, Resolver, UseFormProps } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { type z } from "zod"

export const useZodForm = <TSchema extends z.ZodType<unknown, FieldValues>>(
  props: Omit<UseFormProps<TSchema["_input"]>, "resolver"> & {
    schema: TSchema
  },
) => {
  const form = useForm<TSchema["_input"], unknown, TSchema["_output"]>({
    ...props,
    resolver: zodResolver(props.schema, undefined) as Resolver<
      TSchema["_input"],
      unknown,
      TSchema["_output"]
    >,
  })

  return form
}
