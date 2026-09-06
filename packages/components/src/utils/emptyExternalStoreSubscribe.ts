// useSyncExternalStore requires a subscribe callback even when the snapshot
// never changes after hydration.
export const emptyExternalStoreSubscribe = () => {
  return () => {
    // no-op unsubscribe
  }
}
