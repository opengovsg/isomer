const mockFeatureFlags = new Map<string, any>()
mockFeatureFlags.set("whitelisted_users", {
  whitelist: ["test@open.gov.sg"],
})

export { mockFeatureFlags }
