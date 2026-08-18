import { test } from "@playwright/test"

// TODO: EditUserModal, RemoveUserModal, and AddUserModal all close the modal
// via React Query's `onSettled` (see EditUserModal.tsx:67), which fires on
// both success AND error. So a failed mutation today closes the modal the
// same as a successful one, rather than keeping it open for the admin to
// retry — the opposite of what this test is meant to cover. Un-skip and
// implement once the modals are changed to stay open (and preserve form
// state) when their mutation errors.
test.skip("mutation failures keep the modal open and permit retry", async () => {})
