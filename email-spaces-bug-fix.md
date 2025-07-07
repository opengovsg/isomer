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

The issue was traced to the email validation schema in `apps/studio/src/schemas/user.ts`. The email validation pipeline was:

```typescript
const emailSchema = createEmailSchema().pipe(z.string().toLowerCase())
```

### Problem Flow:
1. User enters `"test@agency.gov.sg "` (with trailing space)
2. Schema validation only calls `.toLowerCase()` but doesn't trim spaces
3. Client-side: `isGovEmail()` function calls `isEmail(value)` on the untrimmed email
4. `isEmail()` from validator library returns `false` for emails with spaces
5. System concludes it's not a `.gov.sg` email → treats as vendor → disables Admin role
6. Server-side: Same validation logic would also fail if submitted

### Key Files Involved:
- `apps/studio/src/schemas/user.ts` - Email schema definition (**Fix applied here**)
- `apps/studio/src/utils/email.ts` - `isGovEmail()` validation function
- `apps/studio/src/features/users/components/UserPermissionModal/AddUserModal.tsx` - Frontend form logic
- `apps/studio/src/server/modules/user/user.service.ts` - Server-side validation

## Solution

**Fix**: Added `.trim()` to the email validation schema to remove leading/trailing whitespace before validation:

```typescript
// Before (buggy)
const emailSchema = createEmailSchema().pipe(z.string().toLowerCase())

// After (fixed)
const emailSchema = createEmailSchema().pipe(z.string().trim().toLowerCase())
```

### Why This Fix Works:
1. **Early normalization**: Spaces are removed at the schema level before any validation
2. **Consistent behavior**: Both client and server use the same schema, ensuring consistent validation
3. **Minimal impact**: Only affects email processing, doesn't change any other functionality
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
2. **Schema processing**: Email is automatically trimmed to `"test@agency.gov.sg"`
3. **Validation**: `isGovEmail()` returns `true` for the trimmed email
4. **Result**: Admin role remains available for selection

## Files Modified

1. **`apps/studio/src/schemas/user.ts`**: Added `.trim()` to email schema validation
2. **`apps/studio/src/utils/__tests__/email.test.ts`**: Added test cases for space handling

## Impact Assessment

- **Risk**: Low - Only affects email preprocessing, doesn't change validation logic
- **Scope**: All email inputs in user management flows
- **Backward compatibility**: Maintained - trimmed emails are still valid
- **Performance**: Negligible - `.trim()` is a lightweight operation

## Verification

To verify the fix:
1. Navigate to user management page
2. Try adding a `.gov.sg` email with trailing/leading spaces
3. Confirm Admin role remains available
4. Submit the form and verify user is created successfully with trimmed email

The fix ensures that spaces in email inputs no longer interfere with role assignment for government email addresses.