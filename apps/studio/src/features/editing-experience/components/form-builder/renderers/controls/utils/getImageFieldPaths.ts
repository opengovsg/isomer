import { getParentPath } from "./getParentPath"

// JSON Forms paths are dot-separated ("content.2.src"). The alt text lives on
// the same object, but the field names differ by component.
const ALT_FIELD_BY_IMAGE_FIELD: Record<string, string> = {
  src: "alt",
  imageSrc: "imageAlt",
  imageUrl: "imageAlt",
}

export const getImageFieldPaths = (
  srcPath: string,
): { parentPath: string; altPath: string | undefined } => {
  const parentPath = getParentPath(srcPath)
  const fieldName = srcPath.slice(srcPath.lastIndexOf(".") + 1)
  const altField = ALT_FIELD_BY_IMAGE_FIELD[fieldName]

  if (!altField) {
    return { parentPath, altPath: undefined }
  }

  return {
    parentPath,
    altPath: parentPath ? `${parentPath}.${altField}` : altField,
  }
}
