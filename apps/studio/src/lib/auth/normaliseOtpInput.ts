import { OTP_LENGTH, OTP_PREFIX_ALPHABET, OTP_PREFIX_LENGTH } from "./constants"

// Whitespace (including non-breaking), zero-width characters, and the
// separators people copy along with a code: hyphens, dashes, underscores,
// dots and middots. The OTP email shows "MZS – JHDZRB".
const IGNORED_CHARACTERS = /[\s​-‍⁠﻿\-‐-―_.·]/g

const isPrefix = (value: string) =>
  [...value].every((char) => OTP_PREFIX_ALPHABET.includes(char))

/**
 * Cleans what a user typed or pasted into the OTP field, so that copying
 * "MZS-JHDZRB", "MZS – JHDZRB" or " JHDZRB " from the email all become
 * "JHDZRB".
 *
 * Only separators are dropped. Other characters outside the OTP alphabet
 * (e.g. "0" or "O") are kept, so a mistyped code still fails validation
 * visibly instead of characters silently disappearing.
 */
export const normaliseOtpInput = (raw: string): string => {
  const cleaned = raw.toUpperCase().replace(IGNORED_CHARACTERS, "")

  // A pasted "prefix + code" is exactly this long. Shorter input is left
  // alone so a code that happens to start with letters isn't truncated.
  const hasPastedPrefix =
    cleaned.length === OTP_PREFIX_LENGTH + OTP_LENGTH &&
    isPrefix(cleaned.slice(0, OTP_PREFIX_LENGTH))

  const token = hasPastedPrefix ? cleaned.slice(OTP_PREFIX_LENGTH) : cleaned

  return token.slice(0, OTP_LENGTH)
}
