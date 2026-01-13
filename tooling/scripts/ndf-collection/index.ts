import { select } from "@inquirer/prompts";
import { createActiveIngredientCollection } from "./createActiveIngredientCollection";
import { createProductInformationCollection } from "./createProductInformationCollection";
import { createPharmacologicalClassificationsList } from "./createPharmacologicalClassificationsList";

const main = async () => {
  const migrationType = await select({
    message: "Select the type of migration you want to perform:",
    choices: [
      {
        name: "Create active ingredients collection",
        value: "active-collection",
      },
      {
        name: "Create product information collection",
        value: "product-information",
      },
      {
        name: "Create pharmacological classifications listing page",
        value: "pharmacological-classifications",
      },
    ],
  });

  switch (migrationType) {
    case "active-collection":
      await createActiveIngredientCollection();
      break;
    case "product-information":
      await createProductInformationCollection();
      break;
    case "pharmacological-classifications":
      await createPharmacologicalClassificationsList();
      break;
    default:
      console.error("Invalid migration type selected.");
      break;
  }
};

main().catch((error) => console.error(error));
