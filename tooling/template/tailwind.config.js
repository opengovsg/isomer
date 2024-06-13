/** @type {import('tailwindcss').Config} */
import siteConfig from "./data/config.json";
import { NextPreset } from "@opengovsg/isomer-components";

const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@opengovsg/isomer-components/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [NextPreset],
  theme: {
    extend: {
      colors: {
        site: {
          primary: {
            DEFAULT: siteConfig.colors["site-primary-default"],
            100: siteConfig.colors["site-primary-100"],
            200: siteConfig.colors["site-primary-200"],
          },
          secondary: {
            DEFAULT: siteConfig.colors["site-secondary-default"],
          },
        },
      },
    },
  },
};

export default config;
