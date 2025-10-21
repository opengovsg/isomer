// Rankings are adapted from JSONForms' Material Renderers package
export const JSON_FORMS_RANKING = {
  ArrayControl: 4,
  TagCategoryControl: 5,
  TaggedControl: 4,
  BooleanControl: 2,
  ConstControl: 2,
  HiddenControl: 99999999999, // Always rendered first
  ImageControl: 2,
  IntegerControl: 4,
  TextAreaControl: 1,
  TextControl: 1,
  // NOTE: has to be higher than `TextControl`
  UuidControl: 2,
  ObjectControl: 2,
  // NOTE: needs to have higher priority than anyof
  ChildrenPagesControl: 4,
  // NOTE: needs to have higher priority than array
  ChildrenPagesOrderingControl: 5,
  // NOTE: needs to have higher priority than array
  NavbarControl: 5,
  AllOfControl: 3,
  AnyOfControl: 3,
  CategoryControl: 3,
  CollectionDropdownControl: 3,
  ProseControl: 3,
  LinkControl: 3,
  RefControl: 3,
  GroupLayoutRenderer: 1,
  VerticalLayoutRenderer: 1,
  UnionRootControl: 1,
  Catchall: -99999999999,
}

export const PROSE_COMPONENT_NAME = "Text component"

export const TEXTAREA_CHARACTERS_PER_ROW = 70
