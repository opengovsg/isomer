import fs from "fs";
import path from "path";
import Papa from "papaparse";
import {
  NDF_GENERAL_MONOGRAPH_CSV_FILEPATH,
  NDF_PRODUCT_INFORMATION_CSV_FILEPATH,
} from "./config";
import {
  getProductInformationLink,
  getProductInformationPage,
} from "./template";
import { safeCsvParse } from "./utils";

export const createProductInformationCollection = async () => {
  console.log("Creating product information collection...");

  const generalMonographData = await safeCsvParse(
    NDF_GENERAL_MONOGRAPH_CSV_FILEPATH
  );
  const filteredGeneralMonographData = generalMonographData.filter(
    (entry) =>
      entry["Publish Status"] === "Active" &&
      entry["Editorial Status"] &&
      ["New", "Revised", "Unchanged"].includes(entry["Editorial Status"])
  );

  const productInfoData = await safeCsvParse(
    NDF_PRODUCT_INFORMATION_CSV_FILEPATH
  );
  const filteredProductInfoData = productInfoData.filter(
    (entry) =>
      entry["Publish Status"] === "Active" &&
      entry["Editorial Status"] &&
      ["New", "Revised", "Unchanged"].includes(entry["Editorial Status"])
  );

  for (const entry of filteredProductInfoData) {
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
    const exemptions =
      entry[
        "Prescription Only Medicines with Exemptions for Supply without Prescription"
      ] ?? "NA";
    const monographId =
      filteredGeneralMonographData.find(
        (monograph) => monograph["Monograph Name"] === entry["Monograph Name"]
      )?.["Monograph ID"] ?? "";

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
      exemptions,
      indications,
      dosage,
      contraindications,
      monographId,
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
      activeIngredient,
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
