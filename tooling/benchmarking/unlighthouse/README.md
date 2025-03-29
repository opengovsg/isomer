# Unlighthouse Benchmarking Tool

This tool provides a systematic way to benchmark multiple websites using [Unlighthouse](https://unlighthouse.dev/), a Lighthouse-based site-wide auditing tool. It allows batch processing of websites, result analysis, and deployment of reports to Cloudflare Pages.

## Overview

The Unlighthouse Benchmarking Tool consists of three main scripts:

1. `run_benchmark.sh` - Runs Lighthouse tests on websites listed in a CSV file
2. `generate_report.sh` - Analyzes results and generates a CSV report
3. `upload_result.sh` - Deploys the results to Cloudflare Pages for easy viewing

## Prerequisites

- [Unlighthouse CI](https://unlighthouse.dev/ci) (`unlighthouse-ci`)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (for Cloudflare Pages deployments)

## Setup

1. Install the required packages:

```bash
npm install
```

2. Create a CSV file named `sites.csv` with the following format:

```
site_name,site_url
example1,https://example1.com
example2,https://example2.com
```

## Usage

You can run the scripts individually or use the npm scripts provided in the package.json file.

### Run Benchmarks

Runs Lighthouse tests on all sites listed in sites.csv:

```bash
npm run run-benchmark
```

This will:

- Process each site from the CSV file
- Run Unlighthouse CI with 3 samples per page (as configured)
- Store results in the `./results/{site_name}` directory

### Generate Report

Analyzes the benchmarking results and creates a summary report:

```bash
npm run generate-report
```

This will:

- Calculate average scores for each site across all tested pages
- Generate a CSV report with scores for:
  - Overall score
  - Performance
  - Accessibility
  - Best Practices
  - SEO
  - Site Quality (average of accessibility, best practices, and SEO)

### Upload Results

Deploys the results to Cloudflare Pages for easy viewing:

```bash
npm run upload-result
```

This will:

- Deploy each site's results to a separate Cloudflare Pages project
- The project name will match the site's name used in the CSV file
- Results will be deployed to the "production" branch

## Configuration

The tool uses a TypeScript configuration file `unlighthouse.config.ts` to configure Unlighthouse:

```typescript
export default {
  scanner: {
    samples: 3, // Run the CI 3 times for each page to improve accuracy
  },
};
```

You can modify this file to adjust Unlighthouse settings as needed.

## Results

- Individual site results are stored in the `./results/{site_name}` directory
- A summary report is generated as `./report.csv`
- Results are also deployed to Cloudflare Pages for visual inspection

## Troubleshooting

If you encounter issues:

1. Ensure all prerequisites are installed
2. Check that the `sites.csv` file exists and is properly formatted
3. Verify that you have proper permissions for Cloudflare Pages deployments
4. Examine the logs for specific error messages
