import fs from "fs"
import csv from "csv-parser"

export const readCsv = <T>(
  fileName = "./prisma/scripts/data.csv",
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    fs.createReadStream(fileName)
      .pipe(csv())
      .on("data", (data) => {
        results.push(data)
      })
      .on("end", () => {
        resolve(results)
      })
      .on("error", reject)
  })
}
