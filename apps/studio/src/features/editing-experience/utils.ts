import type { IsomerComponent } from '@opengovsg/isomer-components';
import { IsomerNativeComponentsMap } from '@opengovsg/isomer-components'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import type { ProseProps } from '@opengovsg/isomer-components/dist/cjs/interfaces'

export const dataAttr = (value: unknown) => (!!value ? true : undefined)


const proseSchema = IsomerNativeComponentsMap.prose
const compiled = TypeCompiler.Compile(proseSchema)

export const inferAsProse = (component?: IsomerComponent): ProseProps => {
  if (!component) {
    throw new Error(`Expected component of type prose but got undefined`)
  }

  if (compiled.Check(component)) {
    return component
  }

  throw new Error(`Expected component of type prose but got type ${component.type}`)
}

