// NOTE: See here for the full list of pg err codes
// https://github.com/postgres/postgres/blob/master/src/backend/utils/errcodes.txt
export const PG_ERROR_CODES = {
  uniqueViolation: "23505",
} as const
