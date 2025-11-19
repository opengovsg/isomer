import { select } from "@inquirer/prompts";
import { createActiveIngredientCollection } from "./createActiveIngredientCollection";
import { createProductInformationCollection } from "./createProductInformationCollection";

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
    ],
  });

  switch (migrationType) {
    case "active-collection":
      await createActiveIngredientCollection();
      break;
    case "product-information":
      await createProductInformationCollection();
      break;
    default:
      console.error("Invalid migration type selected.");
      break;
  }
};

main().catch((error) => console.error(error));
