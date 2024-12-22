import * as fs from "fs";

export const readAllNonIndexFiles = (path: string): string[] => {
  if (fs.statSync(path).isFile()) {
    return [path];
  }

  const entries = fs.readdirSync(path, { withFileTypes: true });
  return entries.flatMap((ent) => {
    if (ent.isDirectory())
      return readAllNonIndexFiles(`${ent.parentPath}/${ent.name}`);
    return [`${ent.parentPath}/${ent.name}`];
  });
};
