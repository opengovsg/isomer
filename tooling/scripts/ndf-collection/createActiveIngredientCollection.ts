import fs from "fs";
import path from "path";

import {
  NDF_GENERAL_MONOGRAPH_CSV_FILEPATH,
  NDF_PRODUCT_INFORMATION_CSV_FILEPATH,
} from "./config";
import { getSimilarKeysAsArray, safeCsvParse } from "./utils";
import { getMonographPage } from "./template";

export const createActiveIngredientCollection = async () => {
  console.log("Creating active ingredient collection...");

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

  const activeIngredientToMonographMap: Record<string, string[]> = {};

  for (const entry of filteredGeneralMonographData) {
    const monographId = entry["Monograph ID"] ?? "";
    const activeIngredients = getSimilarKeysAsArray(
      entry,
      "Active Ingredient Group_"
    );

    for (const ingredient of activeIngredients) {
      if (!ingredient.endsWith(" $")) {
        // Skip the non-landing page active ingredients
        continue;
      }

      activeIngredientToMonographMap[ingredient] ??= [];
      activeIngredientToMonographMap[ingredient].push(monographId);
    }
  }

  for (const entry of filteredGeneralMonographData) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const permalink = entry["Monograph ID"]!;
    const monographName = entry["Monograph Name"] ?? "";
    const isLandingPage = monographName.endsWith(" #");
    let landingPageRelatedMonographs: Record<string, string>[] = [];

    if (isLandingPage) {
      const searchKey = `${monographName.slice(0, -2)} $`;
      const relatedMonographIds =
        activeIngredientToMonographMap[searchKey] ?? [];
      landingPageRelatedMonographs = filteredGeneralMonographData.filter(
        (e) =>
          relatedMonographIds.includes(e["Monograph ID"] ?? "") &&
          e["Monograph ID"] !== permalink
      );
    }

    const activeIngredients = getSimilarKeysAsArray(
      entry,
      "Active Ingredient Group_"
    ).map((ingredient) =>
      ingredient.endsWith(" $") ? ingredient.slice(0, -2) : ingredient
    );
    const synomyms =
      entry.Synonym && entry.Synonym !== "NA"
        ? entry.Synonym.split("|").map((s) => s.trim())
        : [];
    const subsidyInfo = getSimilarKeysAsArray(
      entry,
      "Subsidy Information and Financing Scheme_"
    );
    const drugGuidance = getSimilarKeysAsArray(
      entry,
      "Drug Guidance for Subsidy_"
    );
    const postMarketingInfo = getSimilarKeysAsArray(
      entry,
      "Post-marketing Information_"
    );
    const guidanceRecommendation = getSimilarKeysAsArray(
      entry,
      "Guidance Recommendations_"
    );
    const generalAvailability = getSimilarKeysAsArray(
      entry,
      "General Availability in  Public Healthcare Institutions_"
    );
    const additionalInformation = entry["Additional Information"] ?? "";
    const matchingProductInfo = filteredProductInfoData.filter(
      (productInfo) => productInfo["Monograph Name"] === monographName
    );

    const jsonContent = getMonographPage({
      activeIngredients,
      synomyms,
      monographName: isLandingPage ? monographName.slice(0, -2) : monographName,
      subsidyInfo,
      drugGuidance,
      postMarketingInfo,
      guidanceRecommendation,
      generalAvailability,
      additionalInformation,
      matchingProductInfo,
      landingPageRelatedMonographs,
    });

    // Write to file
    const outputPath = path.join(
      process.cwd(),
      "output",
      "active-ingredient",
      `${permalink}.json`
    );
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(jsonContent, null, 2),
      "utf-8"
    );
  }
};
