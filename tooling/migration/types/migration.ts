import { Tagged } from "type-fest";

export type Outpath = string;
export type Inpath = string;
export type MigrationMapping = Tagged<
  Record<Outpath, Inpath>,
  "MigrationMapping"
>;
