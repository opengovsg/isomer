# Isomer Benchmarking Tools

This directory contains utilities for benchmarking Isomer sites.

## Generate Sites from Infrastructure

The `generateSites.ts` script processes a CSV file containing information about Isomer sites and generates a filtered list of sites for benchmarking.

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Ensure you have a `sites.production.csv` file in the `utils` directory. You can obtain this from our infrastructure repository.

### Running the Script

You can run the script using npm:

```bash
npm run generate-sites
```
