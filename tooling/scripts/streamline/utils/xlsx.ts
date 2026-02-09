import * as fs from "fs";
import * as xlsx from "xlsx";

xlsx.set_fs(fs);

export const createXlsxBook = () => xlsx.utils.book_new();

export const addXlsxSheet = (
  workbook: xlsx.WorkBook,
  sheetName: string,
  header: string[],
  data: (string | number | boolean | undefined)[][]
) => {
  const worksheet = xlsx.utils.json_to_sheet(data);
  xlsx.utils.sheet_add_aoa(worksheet, [header]);
  xlsx.utils.sheet_add_json(worksheet, data, {
    origin: "A2",
    skipHeader: true,
  });
  xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
};

export const writeToXlsxFile = (workbook: xlsx.WorkBook): Buffer =>
  xlsx.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
    bookSST: false,
  });
