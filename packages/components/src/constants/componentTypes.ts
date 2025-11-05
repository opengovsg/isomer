export const COMPONENT_TYPES_MAP = {
  CollectionBlock: "collectionblock",
  ContactInformation: "contactinformation",
  DynamicComponentList: "dynamiccomponentlist",
  DynamicDataBanner: "dynamicdatabanner",
  ImageGallery: "imagegallery",
} as const

export type ComponentTypeId =
  (typeof COMPONENT_TYPES_MAP)[keyof typeof COMPONENT_TYPES_MAP]
