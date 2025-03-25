# Unlighthouse Benchmarking Tool

This tool enables automated website performance benchmarking for Isomer websites using [Unlighthouse](https://unlighthouse.dev/), a Lighthouse-based website scanning tool. It allows for batch processing of multiple sites and deploying the results to Cloudflare Pages.

## Overview

The Unlighthouse benchmarking tool provides:

- Automated scanning of multiple websites using Lighthouse
- Output of comprehensive performance, accessibility, and SEO metrics
- Deployment of results to Cloudflare Pages for easy sharing
- Generation of site lists from infrastructure data
- Creation of overview performance reports across all sites

## Prerequisites

- On OGP VPN to avoid triggering WAF
- Node.js (v16 or higher)
- Cloudflare Wrangler CLI (for results upload)
- Proper authentication for Cloudflare Pages deployment

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create or update the sites list in `sites.csv` (or generate it - see below)

3. Run the benchmark:

   ```bash
   npm run run-benchmark
   ```

4. Upload results to Cloudflare Pages:

   ```bash
   npm run upload-results
   ```

5. Generate an overview report of all sites:
   ```bash
   npm run generate-overview
   ```

## Available Scripts

- `npm run run-benchmark` - Runs Unlighthouse CI for all sites in sites.csv
- `npm run upload-results` - Uploads the generated results to Cloudflare Pages
- `npm run generate-overview` - Generates an overview markdown table of performance metrics for all sites

## Site Configuration

Sites are defined in the `sites.csv` file with the following format:

```
site-name,https://www.example.com
another-site,https://another-example.com
```

Each line contains a site name (used for the output directory) and the URL to test.

## Sites List

You'll need to create or obtain a `sites.csv` file containing the list of sites to benchmark. This file should be located in the root directory of the benchmarking tool.

The sites list should contain site names and their corresponding URLs, with each site on a separate line in CSV format.

## Generating Overview Report

After running benchmarks for multiple sites, you can generate a comprehensive overview report:

```bash
npm run generate-overview
```

This script:

1. Reads all `ci-result.json` files from each site's directory in the `results/` folder
2. Calculates averages for key metrics:
   - Overall score
   - Performance
   - Accessibility
   - Best Practices
   - SEO
   - Site Quality (average of accessibility, best practices, and SEO)
3. Generates a markdown table with these metrics
4. Saves the report to `overview-report.md`

The overview report provides a quick comparison of all sites' performance at a glance.

## Results

After running the benchmark, results will be stored in the `results/` directory, with each site having its own subdirectory. The results include:

- Performance metrics
- Lighthouse scores
- Detailed reports for each page
- Aggregated statistics

## Deploying Results

Results can be automatically deployed to Cloudflare Pages, with each site's results getting its own project:

```bash
npm run upload-results
```

This script:

1. Finds all subdirectories in the `results/` folder
2. Uses the directory name as the Cloudflare Pages project name
3. Deploys each directory to its respective project

## Configuration

You can customize the Unlighthouse configuration in `unlighthouse.config.ts`:

```typescript
export default {
  puppeteerClusterOptions: {
    maxConcurrency: 1, // Run sites one at a time for accuracy
  },
  scanner: {
    samples: 1, // Number of samples per page
  },
};
```

## Troubleshooting

If you encounter issues:

1. Make sure sites.csv is properly formatted
2. Check Cloudflare authentication for upload issues
3. Verify that all URLs in sites.csv are accessible
4. Ensure the `results/` directory contains the expected site subdirectories with ci-result.json files

## Next Steps

The current implementation requires manual execution to generate reports. Future improvements include:

1. **Automated Cron Job**: Integrate this benchmarking tool into the infrastructure as a scheduled cron job to run periodically (e.g., weekly or monthly).

2. **Historical Trend Analysis**: Store and analyze performance metrics over time to track improvements or regressions.

3. **Automated Notifications**: Send alerts or reports when performance metrics fall below certain thresholds.

4. **Dashboard Integration**: Create a dashboard to visualize performance trends across all sites.

In the meantime, the current scripts can be used to manually generate and publish reports as needed.
