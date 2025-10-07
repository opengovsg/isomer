// This is the threshold for a build to be considered recent
// It is roughly the amount of time it takes for a build to progress before
// the publishing script queries the database for the pages data, as that older
// build would have already captured the latest changes

export const RECENT_BUILD_THRESHOLD_SECONDS = 30
