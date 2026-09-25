import { getParentPath } from "./getParentPath"

// Image controls are bound to a component's `src`. JSON Forms paths are
// dot-separated ("content.2.src"). `alt` is the sibling field on that same
// object ("content.2.alt").
export const getImageFieldPaths = (
  srcPath: string,
): { parentPath: string; altPath: string | undefined } => {
  const parentPath = getParentPath(srcPath)
  const fieldName = srcPath.slice(srcPath.lastIndexOf(".") + 1)

  if (fieldName !== "src") {
    return { parentPath, altPath: undefined }
  }

  return {
    parentPath,
    altPath: parentPath ? `${parentPath}.alt` : "alt",
  }
}
