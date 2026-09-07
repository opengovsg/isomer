/* oxlint-disable typescript/no-unsafe-type-assertion, eslint/no-unused-vars -- studio lint cleanup */
import type {
  FormatOptionLabelMeta,
  GroupBase,
  OptionBase,
  SelectComponentsConfig,
  SelectInstance,
  SingleValue,
} from "chakra-react-select"
import { Select } from "chakra-react-select"
import React from "react"

export interface BaseSelectOption<T> extends OptionBase {
  value: T
  label: string
}

export interface BaseSelectProps<T> {
  placeholder?: string
  options: BaseSelectOption<T>[]
  // must have a label of some sort, along with a value
  value: T | null
  // can take in any nullable value
  onChange: (s: T | null) => void
  isDisabled?: boolean
  height?: string
  formatOptionLabel?: (
    option: BaseSelectOption<T>,
    meta: FormatOptionLabelMeta<BaseSelectOption<T>>,
  ) => React.ReactNode
  isSearchable?: boolean
  isClearable?: boolean
  customComponents?: SelectComponentsConfig<
    BaseSelectOption<T>,
    false,
    GroupBase<BaseSelectOption<T>>
  >
}

interface BaseSelectComponent {
  <T>(
    props: BaseSelectProps<T> &
      React.RefAttributes<SelectInstance<BaseSelectOption<T>>>,
  ): React.ReactNode
  displayName?: string
}

const BaseSelectComponent = <T,>(
  {
    formatOptionLabel,
    options,
    value,
    onChange,
    isDisabled,
    isClearable,
    isSearchable = true,
    customComponents,
    ...rest
  }: BaseSelectProps<T>,
  ref: React.ForwardedRef<SelectInstance<BaseSelectOption<T>>>,
) => {
  const transformSelect = {
    // mapping from the value to the option
    input: (valueValue: T | null): BaseSelectOption<T> | null => {
      if (value === null) {
        return null
      }
      const selected = options.find((option) => option.value === value)
      if (selected === undefined) {
        return null
      }
      return selected
    },
    output: (v: SingleValue<BaseSelectOption<T>>): T | null =>
      v ? v.value : null,
  }

  return (
    <Select<BaseSelectOption<T>>
      isSearchable={isSearchable}
      value={transformSelect.input(value)}
      onChange={(valueValue) => {
        onChange(transformSelect.output(valueValue))
      }}
      formatOptionLabel={formatOptionLabel}
      options={options}
      isDisabled={isDisabled}
      isClearable={isClearable}
      components={customComponents}
      ref={ref}
      {...rest}
    />
  )
}

const BaseSelectForwardRef = React.forwardRef(BaseSelectComponent)
export const BaseSelect =
  // SAFETY: forwardRef preserves the generic select props contract for callers
  BaseSelectForwardRef as BaseSelectComponent

BaseSelect.displayName = "BaseSelect"
