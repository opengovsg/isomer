// Helper type to omit a key from a union of types
export type OmitFromUnion<U, K extends PropertyKey> = U extends unknown
  ? Omit<U, K>
  : never
