import { Jsonifiable, Jsonify } from "type-fest";
import { Resource } from "~generatedTypes";

export interface Writer {
  write: ({
    resource,
    blob,
    path,
  }: {
    resource: Pick<Resource, "title" | "permalink" | "type">;
    blob?: Jsonify<Jsonifiable>;
    path: string;
  }) => Promise<void> | void;
}
