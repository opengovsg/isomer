import type {
  FormatOptionLabelMeta,
  GroupBase,
  OptionBase,
  SelectComponentsConfig,
  SelectInstance,
  SingleValue,
} from "chakra-react-select"
import { Select } from "chakra-react-select"

export interface BaseSelectOption<T> extends OptionBase {
  value: T
  label: string
}

export interface BaseSelectProps<T> {
  placeholder?: string
  options: BaseSelectOption<T>[] // must have a label of some sort, along with a value
  value: T | null // can take in any nullable value
  onChange: (s: T | null) => void
  isDisabled?: boolean
  height?: string
  formatOptionLabel?: (
    option: BaseSelectOption<T>,
    meta: FormatOptionLabelMeta<BaseSelectOption<T>>,
  ) => JSX.Element
  isSearchable?: boolean
  isClearable?: boolean
  customComponents?: SelectComponentsConfig<
    BaseSelectOption<T>,
    false,
    GroupBase<BaseSelectOption<T>>
  >
}

export const BaseSelect = <T,>({
  formatOptionLabel,
  options,
  value,
  onChange,
  isDisabled,
  isClearable,
  isSearchable = true,
  customComponents,
  ref,
  ...rest
}: BaseSelectProps<T> & {
  ref?: React.Ref<SelectInstance<BaseSelectOption<T>>>
}) => {
  const transformSelect = {
    // mapping from the value to the option
    input: (value: T | null): BaseSelectOption<T> | null => {
      if (value === null) return null
      const selected = options.find((option) => option.value === value)
      if (selected === undefined) return null
      return selected
    },
    output: (v: SingleValue<BaseSelectOption<T>>): T | null => {
      return v ? v.value : null
    },
  }

  return (
    <Select<BaseSelectOption<T>>
      isSearchable={isSearchable}
      value={transformSelect.input(value)}
      onChange={(value) => onChange(transformSelect.output(value))}
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

BaseSelect.displayName = "BaseSelect"
