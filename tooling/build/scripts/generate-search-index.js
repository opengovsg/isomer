const fs = require("fs");
const path = require("path");

const schemaDirectory = path.join(__dirname, "../schema");
let finalIndex = [];
let indexId = 0; // Counter for the running order of each index's record

function decodeAndStripMarkdown(base64Content) {
  const decodedContent = Buffer.from(base64Content, "base64").toString("utf-8");
  const strippedContent = decodedContent
    .replace(/!\[[^\]]*\]\([^\)]+\)/g, "") // Remove images
    .replace(/\[[^\]]+\]\([^\)]+\)/g, "") // Remove links
    .replace(/[*_~`>#-]+/g, "") // Remove styling characters
    .replace(/\n+/g, " "); // Replace newlines with spaces
  return strippedContent;
}

function extractIndexableContent(schemaContent) {
  const parsedContent = JSON.parse(schemaContent);
  const indexableObject = {
    id: indexId.toString(), // Assign the current indexId as a string
    title: "",
    content: "",
    url: parsedContent.permalink || "", // Assign URL from permalink
  };

  if (parsedContent.title) {
    indexableObject.title = parsedContent.title;
  }

  parsedContent.components?.forEach((component) => {
    component.indexable?.forEach((fieldPath) => {
      if (fieldPath === "props.markdown") {
        const decodedStrippedContent = decodeAndStripMarkdown(
          component.props.markdown
        );
        indexableObject.content += decodedStrippedContent + " ";
      }
    });
  });

  indexableObject.content = indexableObject.content.trim();

  indexId++; // Increment the counter after adding each record
  return indexableObject;
}

function readSchemaFiles(directory) {
  fs.readdirSync(directory).forEach((file) => {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      readSchemaFiles(fullPath);
    } else if (file === "schema.json") {
      const schemaContent = fs.readFileSync(fullPath, "utf-8");
      const indexableObject = extractIndexableContent(schemaContent);
      finalIndex.push(indexableObject);
    }
  });
}

readSchemaFiles(schemaDirectory);

fs.writeFileSync(
  path.join(__dirname, "../searchIndex.json"),
  JSON.stringify(finalIndex, null, 2)
);
console.log("Search index created successfully!");
