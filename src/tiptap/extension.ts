import { Extension } from "@tiptap/core"
import { IsomerNextTiptap } from "~/templates/next"
import type { IsomerTiptapOptions } from "~/types"

export const IsomerTiptap = Extension.create<IsomerTiptapOptions>({
  name: "isomer",

  addOptions() {
    return {
      theme: "isomer-next",
    }
  },

  addExtensions() {
    if (this.options.theme === "isomer-next") {
      return [IsomerNextTiptap]
    }

    return []
  },
})
