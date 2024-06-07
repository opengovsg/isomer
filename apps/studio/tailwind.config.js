/** @type {import('tailwindcss').Config} */
import classicPreset from './src/presets/classic'
import nextPreset from './src/presets/next'
import { ClassicPreset, NextPreset } from '@opengovsg/isomer-components'

export default {
  content: [
    // './index.html',
    // './src/**/*.{js,ts,jsx,tsx}',
    // './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@opengovsg/isomer-components/**/*.{js,ts,jsx,tsx}',
    './node_modules/@opengovsg/isomer-components/**/*.{js,ts,jsx,tsx}',
    '../../node_modules/@opengovsg/isomer-components/**/*.{js,ts,jsx,tsx}',
    // './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  presets: [
    //   // Note: This is here temporarily until we can figure out how to load the
    //   // presets dynamically depending on the template being used.
    ClassicPreset,
    NextPreset,
  ],
  theme: {
    extend: {
      colors: {
        // Site-specific colors, will be overwritten by individual sites
        site: {
          primary: {
            DEFAULT: '#f78f1e',
            100: '#fef4e8',
            200: '#ffeec2',
          },
          secondary: {
            DEFAULT: '#4E4541',
            100: '#f4f2F1',
          },
        },
      },
    },
  },
  // plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}
