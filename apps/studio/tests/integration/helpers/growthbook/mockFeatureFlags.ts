const mockFeatureFlags = new Map<string, unknown>()
mockFeatureFlags.set("whitelisted_users", {
  whitelist: ["test@open.gov.sg"],
})

export { mockFeatureFlags }
