export const MAX_DAYS_FROM_LAST_LOGIN = 90 // hardcoded to 90 as per IM8 requirement

// Actor used to attribute audit log entries created by automated jobs (e.g.
// inactive user removal) rather than a human. This row is not created by
// application code — it must be inserted manually in each environment.
export const SYSTEM_USER_EMAIL = "system@isomer.gov.sg"
