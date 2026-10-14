// NOTE: We are updating to 30 minutes because the full grace period
// specified is 30 minutes. If toppan published a gazette wrongly between
// 15-30 minutes, we (Isomer) are technically allowed to remove it
// but at present, Toppan requires an escalation via the emergency form
// to Isomer. Rather than doing this, allow Toppan the full grace period
// to fix the wrong publication.
export const ALLOWED_GAZETTE_DELETION_TIMEFRAME_IN_MINUTES = 30
