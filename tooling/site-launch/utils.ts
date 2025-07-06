import { exec as base } from "child_process"
import { promisify } from "util"

export const exec = promisify(base)
