/**
 * Event name to be used when emitting event to indicate that localStorage has
 * been modified.
 */
export const LOCAL_STORAGE_EVENT = "local-storage"

/**
 * Key to be used when setting localStorage to indicate that the user is logged in
 * This key is solely used to decide what pages to render on the client side.
 * There should still be a server side check to ensure that the user is logged in before
 * rendering any pages.
 */
export const LOGGED_IN_KEY = "is-logged-in"

/**
 * Key to track whether the user has dismissed the "Move the focal point"
 * first-open tooltip in the image adjustment modal's crop/focal editor.
 */
export const IMAGE_ADJUSTMENT_FOCAL_HINT_SEEN_KEY = "image-adjustment-focal-hint-seen"
