import type { IsomerComponent, ProseProps } from '@opengovsg/isomer-components'
import { getComponentSchema } from '@opengovsg/isomer-components'
import Ajv from 'ajv'

export const dataAttr = (value: unknown) => (!!value ? true : undefined)


const proseSchema = getComponentSchema("prose")

export const inferAsProse = (component?: IsomerComponent): ProseProps => {
  if (!component) {
    throw new Error(`Expected component of type prose but got undefined`)
  }

  const ajv = new Ajv({ strict: false })
  const validate = ajv.compile(proseSchema)

  if (validate(component)) {
    return component as ProseProps
  }

  throw new Error(`Expected component of type prose but got type ${JSON.stringify(component)}`)
}

