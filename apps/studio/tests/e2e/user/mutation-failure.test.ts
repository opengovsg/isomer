import { test } from "@playwright/test"

/**
 * TODO(user-modals): Un-skip once user mutation modals keep the dialog open on
 * error so the admin can read the failure and retry without re-opening the form.
 *
 * Today AddUserModal, EditUserModal, and RemoveUserModal all wire `onSettled`
 * to close the modal (e.g. EditUserModal.tsx — `onSettled: onClose`). React
 * Query runs `onSettled` after both success and failure, so a failed invite,
 * edit, or remove closes the modal the same as a successful one.
 *
 * This test should cover: mutation error → modal stays open, form state
 * preserved, admin can fix input and submit again.
 */
test.skip("mutation failures keep the modal open and permit retry", async () => {
  // Arrange
  // Act
  // Assert
})
