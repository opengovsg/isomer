import { md5 } from "js-md5"

export const getDigestFromText = (message: string) => 
  md5(message)

