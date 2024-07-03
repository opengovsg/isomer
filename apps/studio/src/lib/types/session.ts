import type { User } from "@isomer/db";
import { type IronSession } from "iron-session";

import { type SgidSessionProfile } from "~/server/modules/auth/sgid/sgid.utils";

export interface SessionData {
  userId?: User["id"];
  sgid?: {
    sessionState?: {
      codeVerifier: string;
      nonce?: string;
    };
    profiles?: SgidSessionProfile;
  };
}

export type Session = IronSession<SessionData>;
