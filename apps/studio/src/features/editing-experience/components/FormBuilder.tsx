import {
  Box,
  FormControl,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInputField,
  NumberInputStepper,
  RadioGroup,
  Select,
} from '@chakra-ui/react'
import {
  Button,
  FormLabel,
  Input,
  NumberInput,
  Radio,
  Switch,
} from '@opengovsg/design-system-react'
import { type IsomerComponent } from '@opengovsg/isomer-components'
import { useForm } from 'react-hook-form'
import IsomerSchema from './0.1.0.json'
import { getSchemaFieldType } from '~/utils/schema'

// Utility type to get all keys from a union of objects
type UnionKeys<T> = T extends T ? keyof T : never

// TODO: Props here might not make sense, need to check again
export interface FormBuilderProps {
  component: keyof typeof IsomerSchema.components.complex
  data?: IsomerComponent
}

// Strategy:
// - Read the sub-schema for the given component
// - For each prop inside the sub-schema, render the appropriate input field
//
// TODO:
// - Support type = 'array', format = 'prose' to be Tiptap editor
// - Support type = 'array' with items of type = 'object' to be sub-form (no drag and drop yet)
// - Support $ref to other parts of the schema
// - Handle grouping of fields
export function FormBuilder({
  component,
  data,
}: FormBuilderProps): JSX.Element {
  const schema = IsomerSchema.components.complex[component]
  const { required, properties } = schema
  const { register, handleSubmit } = useForm<typeof properties>()
  type ComplexComponentProps = UnionKeys<typeof properties>

  // TODO: Remove or replace with proper submit function
  const onSubmit = handleSubmit((data) => console.log(data))

  return (
    <Box p={4} bg="white">
      <form onSubmit={onSubmit}>
        {Object.keys(properties)
          .filter<Exclude<ComplexComponentProps, 'type'>>(
            (prop): prop is Exclude<ComplexComponentProps, 'type'> =>
              prop !== 'type',
          )
          .map((prop) => {
            const {
              type,
              format,
              enum: options,
              title,
              description,
              // @ts-expect-error this is safe because prop comes direct from properties
            } = properties[prop]
            const fieldType = getSchemaFieldType(type, format, options)

            if (fieldType === 'dropdown') {
              return (
                <Box py={2}>
                  <FormControl isRequired={required.includes(prop)}>
                    <FormLabel description={description}>{title}</FormLabel>
                    <Select placeholder={title} {...register(prop)}>
                      {options.map((option: string) => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )
            }

            if (fieldType === 'radio') {
              return (
                <Box py={2}>
                  <FormControl isRequired={required.includes(prop)}>
                    <FormLabel description={description}>{title}</FormLabel>
                    <RadioGroup>
                      {options.map((option: string) => (
                        <Radio key={option} value={option} {...register(prop)}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </Radio>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </Box>
              )
            }

            if (fieldType === 'text') {
              return (
                <Box py={2}>
                  <FormControl isRequired={required.includes(prop)}>
                    <FormLabel description={description}>{title}</FormLabel>
                    <Input
                      type="text"
                      {...register(prop)}
                      placeholder={title}
                    />
                  </FormControl>
                </Box>
              )
            }

            if (fieldType === 'integer') {
              // @ts-expect-error this is safe because prop comes direct from properties
              const { minimum, maximum } = properties[prop]

              return (
                <Box py={2}>
                  <FormControl isRequired={required.includes(prop)}>
                    <FormLabel description={description}>{title}</FormLabel>
                    <NumberInput min={minimum} max={maximum}>
                      <NumberInputField {...register(prop)} />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </Box>
              )
            }

            if (fieldType === 'boolean') {
              return (
                <Box py={2}>
                  <FormControl isRequired={required.includes(prop)}>
                    <FormLabel description={description} htmlFor={prop}>
                      {title}
                    </FormLabel>
                    <Switch {...register(prop)} id={prop} />
                  </FormControl>
                </Box>
              )
            }

            return (
              <Box py={2}>
                <label>{title} - UNIMPLEMENTED</label>
                <input type="text" {...register(prop)} />
              </Box>
            )
          })}
        <Button type="submit">Submit</Button>
      </form>
    </Box>
  )
}
