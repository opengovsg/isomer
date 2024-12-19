import { Writer } from "../types/writer";

export const consoleWriter: Writer = {
  write: (title, permalink, content) => {
    console.log(title, permalink, JSON.stringify(content));
  },
};
