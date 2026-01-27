import path from "path";

import * as dotenv from "dotenv";
import type {
  CreateApplicationResponse,
  GetAllApplicationsResponse,
  GetAuthTokenResponse,
  GetSpecificApplicationResponse,
} from "./searchsg.types";

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

const ISOMER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) isomer";

export const getAuthToken = async () => {
  const authString = `${process.env.SEARCHSG_USERNAME}:${process.env.SEARCHSG_PASSWORD}`;
  const encodedAuthString = Buffer.from(authString).toString("base64");

  const options = {
    method: "POST",
    headers: {
      "User-Agent": ISOMER_USER_AGENT,
      Authorization: `Basic ${encodedAuthString}`,
    },
  };

  const result = (await fetch(
    "https://api.services.search.gov.sg/admin/v1/auth/token",
    options
  )
    .then((response) => response.json())
    .catch((err) => console.error(err))) as GetAuthTokenResponse;

  return result.accessToken;
};

export const getAllApplications = async (authToken: string) => {
  const options = {
    method: "GET",
    headers: {
      "User-Agent": ISOMER_USER_AGENT,
      Authorization: `Bearer ${authToken}`,
    },
  };

  const result = (await fetch(
    "https://api.services.search.gov.sg/admin/v1/bootstrap/applications",
    options
  )
    .then((response) => response.json())
    .catch((err) => console.error(err))) as GetAllApplicationsResponse;

  return result.data;
};

export const getSpecificApplication = async (
  authToken: string,
  applicationId: string
) => {
  const options = {
    method: "GET",
    headers: {
      "User-Agent": ISOMER_USER_AGENT,
      Authorization: `Bearer ${authToken}`,
    },
  };

  const result = (await fetch(
    `https://api.services.search.gov.sg/admin/v1/bootstrap/applications/${applicationId}`,
    options
  )
    .then((response) => response.json())
    .catch((err) => console.error(err))) as GetSpecificApplicationResponse;

  return result.data;
};

export const createApplication = async (
  authToken: string,
  siteName: string,
  domainName: string,
  themeColour: string
) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": ISOMER_USER_AGENT,
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      agencyId: 31, // Agency ID for GovTech
      name: siteName,
      tenant: {
        adminList: ["isomer@open.gov.sg"],
      },
      index: {
        dataSource: {
          web: [
            {
              domain: `https://${domainName}`,
              documentIndexConfig: {
                indexWhitelist: [],
                indexBlacklist: [],
              },
            },
          ],
          api: [],
        },
      },
      application: {
        siteDomain: domainName,
        environment: "production",
        config: {
          search: {
            theme: {
              primary: themeColour,
              fontFamily: "Inter",
            },
          },
        },
      },
    }),
  };

  const result = (await fetch(
    "https://api.services.search.gov.sg/admin/v1/bootstrap/applications",
    options
  )
    .then((response) => response.json())
    .catch((err) => console.error(err))) as CreateApplicationResponse;

  return result.data;
};
