# Unlighthouse Benchmarking Tool

This tool enables automated website performance benchmarking for Isomer websites using [Unlighthouse](https://unlighthouse.dev/), a Lighthouse-based website scanning tool. It allows for batch processing of multiple sites and deploying the results to Cloudflare Pages.

## Overview

The Unlighthouse benchmarking tool provides:

- Automated scanning of multiple websites using Lighthouse
- Output of comprehensive performance, accessibility, and SEO metrics
- Deployment of results to Cloudflare Pages for easy sharing
- Generation of site lists from infrastructure data

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

## Available Scripts

- `npm run run-benchmark` - Runs Unlighthouse CI for all sites in sites.csv
- `npm run upload-results` - Uploads the generated results to Cloudflare Pages
- `npm run generate-sites` - Generates sites.csv from infrastructure data

## Site Configuration

Sites are defined in the `sites.csv` file with the following format:

```
site-name,https://www.example.com
another-site,https://another-example.com
```

Each line contains a site name (used for the output directory) and the URL to test.

## Generating Sites List

You can automatically generate the sites list from your infrastructure data using:

```bash
npm run generate-sites
```

This script reads from `utils/sites.production.csv` and:

1. Filters for sites in "LAUNCHED" state
2. Excludes sites with domain aliases starting with "test-"
3. Adds "https://" prefix to all domain aliases
4. Adds "-next" suffix to all shortNames
5. Outputs the results to `sites.csv`

`sites.production.csv` can be taken from our infrastructure repository.

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

## Next Steps

The current implementation requires manual execution to generate reports. Future improvements include:

1. **Automated Cron Job**: Integrate this benchmarking tool into the infrastructure as a scheduled cron job to run periodically (e.g., weekly or monthly).

2. **Historical Trend Analysis**: Store and analyze performance metrics over time to track improvements or regressions.

3. **Automated Notifications**: Send alerts or reports when performance metrics fall below certain thresholds.

4. **Dashboard Integration**: Create a dashboard to visualize performance trends across all sites.

In the meantime, the current scripts can be used to manually generate and publish reports as needed.
