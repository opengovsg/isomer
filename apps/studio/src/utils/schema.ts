export type IsomerSchemaFieldType =
  | 'dropdown'
  | 'radio'
  | 'text'
  | 'integer'
  | 'boolean'

export const getSchemaFieldType = (
  type: string,
  format?: string,
  options?: string[],
): IsomerSchemaFieldType | null => {
  if (type === 'string' && options && format === 'select') {
    return 'dropdown'
  }

  if (type === 'string' && options && format === 'radio') {
    return 'radio'
  }

  if (type === 'string') {
    return 'text'
  }

  if (type === 'integer') {
    return 'integer'
  }

  if (type === 'boolean') {
    return 'boolean'
  }

  return null
}
