import type { AssetsMap } from "../types"

const buildCandidatePaths = (assetPath: string): string[] => {
  const filename = assetPath.replace(/^\/(images|files)\//, "")
  const encodedFilename = filename.replaceAll(" ", "%20")

  return [
    filename,
    `/images/${filename}`,
    `/files/${filename}`,
    `/images/${encodedFilename}`,
    `/files/${encodedFilename}`,
  ]
}

export const buildAssetReplacementEntries = (
  fileMapping: AssetsMap,
): Array<[string, string]> => {
  const entries: Array<[string, string]> = []

  for (const [filename, newPath] of Object.entries(fileMapping)) {
    for (const oldPath of buildCandidatePaths(filename)) {
      entries.push([oldPath, newPath])
    }
  }

  entries.sort((a, b) => b[0].length - a[0].length)
  return entries
}

export const rewriteAssetPaths = (
  content: string,
  fileMapping: AssetsMap,
): string => {
  if (Object.keys(fileMapping).length === 0) {
    return content
  }

  let result = content
  const entries = buildAssetReplacementEntries(fileMapping)

  for (const [oldPath, newPath] of entries) {
    result = result
      .replaceAll(`"${oldPath}"`, `"${newPath}"`)
      .replaceAll(`'${oldPath}'`, `'${newPath}'`)
  }

  return result
}
