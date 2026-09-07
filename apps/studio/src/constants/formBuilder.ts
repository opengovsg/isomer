// Rankings are adapted from JSONForms' Material Renderers package
export const JSON_FORMS_RANKING = {
  AllOfControl: 3,
  // NOTE: needs to have higher priority than VerticalLayoutRenderer
  AntiScamDisclaimerBannerLayoutRenderer: 2,
  AnyOfControl: 3,
  ArrayControl: 4,
  BooleanControl: 2,
  // NOTE: needs to have higher priority than ObjectControl
  BoxedGroupControl: 3,
  Catchall: -99_999_999_999,
  // NOTE: Needs to have higher priority than anyof
  // as we need to conditionally render this depending
  // on the parent variant
  ChildrenPagesColControl: 4,
  // NOTE: needs to have higher priority than anyof
  ChildrenPagesControl: 4,
  // NOTE: needs to have higher priority than array
  ChildrenPagesOrderingControl: 5,
  CollectionDropdownControl: 3,
  // NOTE: needs to have higher priority than anyof
  CollectionVariantControl: 4,
  ColourPickerControl: 2,
  ConstControl: 2,
  EnumControl: 2,
  GroupLayoutRenderer: 1,
  HiddenControl: 99_999_999_999,
  // Always rendered first
  ImageControl: 2,
  ImageRadioControl: 4,
  IntegerControl: 4,
  // NOTE: needs to have higher priority than array
  LinkArrayControl: 5,
  LinkControl: 3,
  // NOTE: needs to have higher priority than array
  NavbarControl: 5,
  ObjectControl: 2,
  OneOfControl: 3,
  ProseControl: 3,
  RefControl: 3,
  // NOTE: Needs to be above `AnyOfControl`
  SearchSGControl: 4,
  // NOTE: needs to have higher priority than array
  SocialMediaControl: 5,
  TagCategoryControl: 5,
  TagCategoryOptionsControl: 5,
  TaggedControl: 4,
  TextAreaControl: 1,
  TextControl: 1,
  UnionRootControl: 1,
  // NOTE: has to be higher than `TextControl`
  UuidControl: 2,
  VerticalLayoutRenderer: 1,
  WidgetControl: 3,
}

export const PROSE_COMPONENT_NAME = "Text"

export const TEXTAREA_CHARACTERS_PER_ROW = 70
export const TEXTAREA_DEFAULT_ROWS = 3
export const TEXTAREA_MAX_ROWS = 5
