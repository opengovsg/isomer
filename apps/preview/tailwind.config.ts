import {
  createNextPreset,
  isomerSiteTheme,
} from "@opengovsg/isomer-components"

export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/components/dist/**/*.{js,mjs}",
  ],
  presets: [createNextPreset({ includeFonts: false })],
  plugins: [
    isomerSiteTheme({
      colors: {
        canvas: {
          default: "#e6ecef",
          alt: "#bfcfd7",
          backdrop: "#80a0af",
          inverse: "#00405f",
        },
        interaction: {
          default: "#00405f",
          hover: "#002e44",
          pressed: "#00283b",
        },
      },
    }),
  ],
}
