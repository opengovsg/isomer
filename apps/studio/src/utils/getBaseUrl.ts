import { env } from "@isomer/env";

/**
 * Retrieves the base URL for the current environment.
 * @note Server-only utility function.
 */
export const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL;
  }
  // reference for vercel.com
  // eslint-disable-next-line no-restricted-properties
  if (process.env.VERCEL_URL) {
    // eslint-disable-next-line no-restricted-properties
    return `https://${process.env.VERCEL_URL}`;
  }
  // assume localhost
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env.PORT ?? 3000}`;
};
