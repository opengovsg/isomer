export const RoleType = {
  Admin: "Admin",
  Editor: "Editor",
  Publisher: "Publisher",
} as const;
export type RoleType = (typeof RoleType)[keyof typeof RoleType];
