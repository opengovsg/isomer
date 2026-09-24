---
title: Build forms with useZodForm, not per-field useState
category: React
type: best-practice
---

## Pattern

Build forms with the project's `useZodForm` hook
(`apps/studio/src/lib/form.ts:6`) — a thin wrapper over react-hook-form's
`useForm` wired to a zod schema via `zodResolver`. Do not manage form field
values, validation, and error state with a pile of `useState` calls.

Reuse the schema from `apps/studio/src/schemas/` — ideally the same schema the
tRPC procedure validates with (`.input()`), so client and server agree.

## Why

`useState`-per-field reimplements what react-hook-form already gives for free:
validation, error messages, dirty/touched tracking, and submit handling. It
drifts out of sync with the server's zod schema, re-renders the whole form on
every keystroke, and scatters validation logic across handlers. `useZodForm`
derives the input/output types straight from the schema, so the form, the
mutation input, and the server stay type-aligned.

## Bad

```tsx
// Hand-rolled form state — validation and types drift from the schema
const [title, setTitle] = useState("")
const [permalink, setPermalink] = useState("")
const [errors, setErrors] = useState<Record<string, string>>({})

const onSubmit = () => {
  const next: Record<string, string> = {}
  if (!title) next.title = "Enter a title"
  // ...manual validation, easy to diverge from the server schema
  setErrors(next)
}
```

## Good

```tsx
const { register, control, handleSubmit, formState: { errors } } = useZodForm({
  schema: basePageSettingsSchema.omit({ pageId: true, siteId: true }),
  defaultValues: { title: originalTitle, permalink: "" },
})

<form onSubmit={handleSubmit((data) => mutate(data))}>
  <FormControl isInvalid={!!errors.title}>
    <FormLabel isRequired>Title</FormLabel>
    <Input {...register("title")} />
    <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
  </FormControl>
</form>
```

Wire nested fields with `FormProvider` + `useFormContext` in children, and use
`Controller` for non-native inputs (DatePicker, SingleSelect). Surface errors
via `FormControl isInvalid` + `FormErrorMessage`. See
`features/dashboard/components/PageSettingsModal.tsx` and
`features/editing-experience/components/PublishingModal/` for the full idiom.

## Not a smell

`useState` for **UI-only state that isn't part of the schema** is fine — e.g. a
display-only `File` object backing an upload widget, an open/closed toggle, a
hover state. Form *data* flows through react-hook-form (`register` / `control` /
`setValue`); local state just drives presentation. See
`features/gazettes/components/GazetteModal/GazetteFormFields.tsx:62` for a
sanctioned mix.

## How to detect

Look for components rendering inputs with multiple `useState` values plus
`onChange` handlers and manual `if (!value) ...` validation, instead of
`useZodForm` + `register`/`Controller`. Check that the schema is imported from
`~/schemas/` rather than redefined inline.
