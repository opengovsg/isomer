import { mkdirp } from "mkdirp";
import { Writer } from "../types/writer";
import * as fs from "fs";

export const fileWriter: Writer = {
  write: async ({ resource, blob, path }) => {
    // TODO: remember to convert blob to json
    const parentPath = path.split("/").slice(0, -1).join("/");
    await mkdirp(parentPath);

    fs.writeFileSync(path, JSON.stringify({ resource, blob }, null, 2));
  },
};
