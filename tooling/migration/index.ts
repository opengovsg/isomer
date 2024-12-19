import * as fs from "fs";
import { Writer } from "./types/writer";
import { fileWriter } from "./writer";

const MARKDOWN_EXTENSION = ".md";

const SITE_ID = 23; // NOTE: this is the mse site
// NOTE: Folder structure
// NOTE: This is the path to migrate
const migrate = (path: string, writers: Writer[]) => {
  const entries = fs.readdirSync(path, { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory());

  directories.map((dirent) => {
    const category = dirent.name.trim();
    console.log(category);

    // NOTE: Because this is going to be a collection,
    // there's only a single level of pages.
    const pages = fs
      .readdirSync(`${dirent.parentPath}/${dirent.name}`, {
        withFileTypes: true,
        recursive: true,
      })
      .filter(
        (entry) => entry.isFile() && entry.name.endsWith(MARKDOWN_EXTENSION),
      );

    console.log(pages);
  });
};

migrate("repos/mse/news", [fileWriter]);
