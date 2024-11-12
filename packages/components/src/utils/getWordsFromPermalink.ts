export const getWordsFromPermalink = (permalink: string): string => {
  const lastUrlSegment = permalink.split("/").at(-1) ?? ""
  // NOTE: Replace all non-alphanumeric characters with spaces
  // then remove all spaces and join by `+`.
  // This is because we might have run-on spaces from sequences of symbols
  // like: `+=`, which would lead to 2 spaces
  return lastUrlSegment
    .replaceAll(/[\W_]/gi, " ")
    .split(" ")
    .filter((v) => !!v)
    .join("+")
}
