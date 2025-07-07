# Bug Fix: Spaces in Email Field When Adding Collaborators

## Issue Description

**Bug**: When adding collaborators to a site, if a user enters a `.gov.sg` email address with trailing or leading spaces, the system incorrectly treats it as a vendor email and disables the Admin role option.

**Reproduction Steps**:
1. Navigate to Studio and go to the user management page of any site
2. Add a new user to the site
3. Enter a `.gov.sg` email address (e.g., `test@agency.gov.sg`) - verify Admin role is available
4. Add a space at the end of the email address
5. **Bug**: The space causes the system to treat it as a vendor email, and the Admin role becomes unavailable

## Root Cause Analysis

The issue was traced to the frontend modal logic in `AddUserModal.tsx`. The real-time validation that controls Admin role availability was using the raw email input without trimming spaces.

### Problem Flow:
1. User enters `"test@agency.gov.sg "` (with trailing space)
2. Frontend modal's `isNonGovEmailInput` logic calls `isGovEmail(email)` with untrimmed email
3. `isGovEmail()` function calls `isEmail(value)` on the email with spaces
4. `isEmail()` from validator library returns `false` for emails with spaces
5. System concludes it's not a `.gov.sg` email → treats as vendor → disables Admin role immediately
6. This happens in real-time as the user types, before form submission

### Key Files Involved:
- `apps/studio/src/features/users/components/UserPermissionModal/AddUserModal.tsx` - Frontend modal logic (**Primary fix applied here**)
- `apps/studio/src/schemas/user.ts` - Email schema definition (**Secondary fix applied here**)
- `apps/studio/src/utils/email.ts` - `isGovEmail()` validation function
- `apps/studio/src/server/modules/user/user.service.ts` - Server-side validation

## Solution

**Primary Fix**: Modified the frontend modal logic to trim email input before validation:

```typescript
// Before (buggy) - in AddUserModal.tsx
const isNonGovEmailInput = useMemo(
  () => !!(!errors.email && email && !isGovEmail(email)),
  [errors.email, email],
)

// After (fixed) - in AddUserModal.tsx  
const isNonGovEmailInput = useMemo(
  () => !!(!errors.email && email && !isGovEmail(email.trim())),
  [errors.email, email],
)
```

**Secondary Fix**: Added `.trim()` to the email validation schema for consistency on form submission:

```typescript
// Before - in schemas/user.ts
const emailSchema = createEmailSchema().pipe(z.string().toLowerCase())

// After - in schemas/user.ts
const emailSchema = createEmailSchema().pipe(z.string().trim().toLowerCase())
```

### Why This Fix Works:
1. **Real-time validation**: The primary issue was in the frontend modal's real-time validation that disables the Admin role
2. **Immediate feedback**: Users see the correct role options as they type, even with spaces
3. **Form submission consistency**: Schema trimming ensures submitted data is clean
4. **User-friendly**: Users don't need to manually ensure no spaces in their input

## Testing

Added comprehensive test cases in `apps/studio/src/utils/__tests__/email.test.ts`:

```typescript
it("should return false for .gov.sg emails with leading or trailing spaces", () => {
  const emailsWithSpaces = [
    " test@agency.gov.sg",
    "test@agency.gov.sg ",
    " test@agency.gov.sg ",
    "\ttest@agency.gov.sg",
    "test@agency.gov.sg\n",
  ]

  emailsWithSpaces.forEach((email) => {
    expect(isGovEmail(email)).toBe(false)
  })
})

it("should return true for .gov.sg emails when manually trimmed", () => {
  const emailsWithSpaces = [
    " test@agency.gov.sg",
    "test@agency.gov.sg ",
    " test@agency.gov.sg ",
    "\ttest@agency.gov.sg",
    "test@agency.gov.sg\n",
  ]

  emailsWithSpaces.forEach((email) => {
    expect(isGovEmail(email.trim())).toBe(true)
  })
})
```

## Expected Behavior After Fix

1. **Input**: User enters `"test@agency.gov.sg "` (with trailing space)
2. **Real-time validation**: Modal logic trims the email to `"test@agency.gov.sg"` before calling `isGovEmail()`
3. **Validation**: `isGovEmail()` returns `true` for the trimmed email
4. **Result**: Admin role remains available for selection in real-time
5. **Form submission**: Schema trimming ensures the submitted email is clean

## Files Modified

1. **`apps/studio/src/features/users/components/UserPermissionModal/AddUserModal.tsx`**: Modified `isNonGovEmailInput` calculation to trim email before validation (Primary fix)
2. **`apps/studio/src/schemas/user.ts`**: Added `.trim()` to email schema validation (Secondary fix for consistency)
3. **`apps/studio/src/utils/__tests__/email.test.ts`**: Added test cases for space handling

## Impact Assessment

- **Risk**: Low - Only affects email preprocessing, doesn't change validation logic
- **Scope**: Real-time validation in user management modal + form submission processing
- **Backward compatibility**: Maintained - trimmed emails are still valid
- **Performance**: Negligible - `.trim()` is a lightweight operation

## Verification

To verify the fix:
1. Navigate to user management page
2. Try adding a `.gov.sg` email with trailing/leading spaces
3. Confirm Admin role remains available in real-time as you type
4. Submit the form and verify user is created successfully with trimmed email

The fix ensures that spaces in email inputs no longer interfere with role assignment for government email addresses, both during real-time validation and form submission.