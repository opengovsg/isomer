import { mkdirp } from "mkdirp";
import { Writer } from "../types/writer";
import * as fs from "fs";

export const fileWriter: Writer = {
  write: async (title, permalink, content) => {
    const parentPath = permalink.split("/").slice(0, -1).join("/");
    await mkdirp(parentPath);
    fs.writeFileSync(permalink, content);
  },
};
