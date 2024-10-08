import { isMatch, parse } from "date-fns"

export const getParsedDate = (dateString: string) => {
  try {
    if (isMatch(dateString, "dd/MM/yyyy")) {
      return parse(dateString, "dd/MM/yyyy", new Date())
    }

    if (isMatch(dateString, "d MMM yyyy")) {
      return parse(dateString, "d MMM yyyy", new Date())
    }

    if (isMatch(dateString, "d MMMM yyyy")) {
      return parse(dateString, "d MMMM yyyy", new Date())
    }

    if (isMatch(dateString, "dd MMM yyyy")) {
      return parse(dateString, "dd MMM yyyy", new Date())
    }

    if (isMatch(dateString, "dd MMMM yyyy")) {
      return parse(dateString, "dd MMMM yyyy", new Date())
    }

    if (isMatch(dateString, "yyyy-MM-dd")) {
      return parse(dateString, "yyyy-MM-dd", new Date())
    }

    if (isMatch(dateString, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")) {
      return parse(dateString, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", new Date())
    }
  } catch (e) {
    return new Date()
  }

  return new Date()
}
