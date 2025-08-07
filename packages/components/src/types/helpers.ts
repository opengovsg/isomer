// Helper type to omit a key from a union of types
type OmitFromUnion<U, K extends PropertyKey> = U extends unknown
  ? Omit<U, K>
  : never
