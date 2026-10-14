import type { ProseProps } from "@opengovsg/isomer-components"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { ajv } from "~/utils/ajv"

const proseSchema = getComponentSchema({ component: "prose" })

const validate = ajv.compile<ProseProps>(proseSchema)

export const isValidProse = (content: unknown): boolean => validate(content)
