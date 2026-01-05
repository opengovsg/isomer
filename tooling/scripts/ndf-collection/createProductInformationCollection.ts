import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { NDF_PRODUCT_INFORMATION_CSV_FILEPATH } from "./config";
import {
  getProductInformationLink,
  getProductInformationPage,
} from "./template";

export const createProductInformationCollection = async () => {
  console.log("Creating product information collection...");

  const csvFileContent = await fs.promises.readFile(
    NDF_PRODUCT_INFORMATION_CSV_FILEPATH,
    "utf-8"
  );

  if (!csvFileContent) {
    console.error(
      `CSV file at path ${NDF_PRODUCT_INFORMATION_CSV_FILEPATH} is empty or not found.`
    );
    return;
  }

  const parsedCsv = Papa.parse(csvFileContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsedCsv.errors.length) {
    console.error("Error parsing CSV file:");
    console.error(parsedCsv.errors);
    return;
  }

  const data = parsedCsv.data as Record<string, string>[];
  const filteredData = data.filter(
    (entry) =>
      entry["Publish Status"] === "Active" &&
      entry["Editorial Status"] &&
      ["New", "Revised", "Unchanged"].includes(entry["Editorial Status"])
  );

  for (const entry of filteredData) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const permalink = entry["Licence number (SIN number)"]!;
    const productName = entry["Product Name"] ?? "";
    const licenseNumber = permalink;
    const activeIngredient = entry["Active Ingredient"] ?? "";
    const strength = entry.Strength ?? "";
    const dosageForm = entry["Dosage Form"] ?? "NA";
    const manufacturer = entry.Manufacturer ?? "";
    const countryOfManufacture = entry["Country of Manufacturer"] ?? "";
    const licenseHolder = entry["Licence Holder"] ?? "NA";
    const forensicClassification = entry["Forensic Classification"] ?? "NA";
    const atcCode = entry["Anatomical Therapeutic Chemical (ATC) code"] ?? "NA";
    const indications = entry.Indications ?? "";
    const dosage = entry.Dosage ?? "";
    const contraindications = entry.Contraindications ?? "";
    const routeOfAdministration = entry["Route of Administration"] ?? "NA";

    const jsonContent = getProductInformationPage({
      productName,
      licenseNumber,
      activeIngredient,
      strength,
      dosageForm,
      manufacturer,
      countryOfManufacture,
      licenseHolder,
      forensicClassification,
      atcCode,
      indications,
      dosage,
      contraindications,
    });

    // Write to file
    const outputPath = path.join(
      process.cwd(),
      "output",
      "product-information",
      `${permalink}.json`
    );
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(jsonContent, null, 2),
      "utf-8"
    );

    const jsonLinkContent = getProductInformationLink({
      productName,
      licenseNumber,
      indications,
      dosage,
      contraindications,
      manufacturer,
      countryOfManufacture,
      routeOfAdministration,
      forensicClassification,
    });

    // Write to file
    const linkOutputPath = path.join(
      process.cwd(),
      "output",
      "list-of-product-information",
      `${permalink}.json`
    );
    await fs.promises.mkdir(path.dirname(linkOutputPath), {
      recursive: true,
    });
    await fs.promises.writeFile(
      linkOutputPath,
      JSON.stringify(jsonLinkContent, null, 2),
      "utf-8"
    );

    // if (permalink === "SIN16609P") {
    //   break;
    // }
  }
};
