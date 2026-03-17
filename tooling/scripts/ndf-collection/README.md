# NDF Collection Scripts

Scripts for generating Isomer-compatible JSON page files from National Drug Formulary (NDF) CSV data. These scripts transform CSV exports into structured JSON that powers the NDF section of the Isomer site.

## What it does

The script provides three migration options (selected via an interactive prompt):

1. **Active Ingredients Collection** — Reads `general-monograph.csv` and `product-information.csv` to generate individual JSON pages for each active ingredient monograph. Output is written to `output/active-ingredient/`.

2. **Product Information Collection** — Reads the same two CSVs to generate individual JSON pages for each product (keyed by licence/SIN number). Output is written to `output/product-information/` and `output/list-of-product-information/`.

3. **Pharmacological Classifications Listing** — Reads `pharmacological-classifications.csv` and `general-monograph.csv` to build a hierarchical ATC classification tree with linked monographs. Output is written to `output/listing-of-pharmacological-classifications.json`.

## Prerequisites

- Node.js (v18+)
- npm (comes with Node.js)

## Setup

1. Navigate to the scripts directory:

   ```sh
   cd tooling/scripts
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Place the required CSV files in the `tooling/scripts/` directory:

   - `general-monograph.csv`
   - `product-information.csv`
   - `pharmacological-classifications.csv`

   The expected file paths are configured in `config.ts`. If your CSV filenames differ, update the paths there.

## Running the script

From the `tooling/scripts/` directory, run:

```sh
npm run ndf
```

This launches an interactive prompt where you select which migration to run. The generated JSON files will be written to the `output/` directory relative to your current working directory.
