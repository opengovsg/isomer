import { IsomerComponent } from "@opengovsg/isomer-components";
import { convertHtmlToSchema } from "./utils";

// NOTE: just renaming this because the convertHtmlToSchema function assigns to a global
// which we cannot do in an import
export const html2schema = convertHtmlToSchema;

export const updateImageSrc = (
  content: IsomerComponent[],
  assetMapping: Record<string, string>,
  prefix: string,
) => {
  return content.map((component) => {
    if (component.type === "image") {
      component.src =
        assetMapping[`${component.src.replace(prefix, "")}`]?.replace(
          /^\./,
          "",
        ) || "https://placehold.co/600x400";
      if (!component.alt) {
        // NOTE: need to do this for migration so they can save...
        component.alt = "This is an example alt text for an image";
      }
    }

    return component;
  });
};
