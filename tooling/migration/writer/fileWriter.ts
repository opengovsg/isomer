import { Writer } from "../types/writer";
import * as fs from "fs";

export const fileWriter: Writer = {
  write: (title, permalink, content) => {
    fs.writeFileSync(permalink, content);
  },
};
