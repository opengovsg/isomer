# Oobee Accessibility Benchmarking Tool

This directory contains tools for running batch accessibility scans on Isomer websites using [Oobee](https://github.com/GovTechSG/oobee), an accessibility testing tool developed by GovTech Singapore.

## Overview

The Oobee benchmarking tool allows you to:

- Run automated accessibility scans across multiple websites
- Generate comprehensive accessibility reports for each site
- Produce a consolidated CSV report with accessibility issues categorized by severity

## Directory Structure

- `run_benchmark.sh` - Main script to run accessibility scans on sites listed in sites.csv
- `generate_report.sh` - Script to compile results into a summary report
- `sites.csv` - List of sites to benchmark (format: site_name,url)
- `report.csv` - Generated summary report of accessibility issues
- `results/` - Directory containing detailed scan results for each site

## Usage

### 1. Define Sites to Test

Edit the `sites.csv` file with the list of sites you want to test. Each line should be in the format:

```
site-name,https://site-url.gov.sg
```

### 2. Run the Benchmark

```bash
npm run run-benchmark
```

This will:

- Install dependencies
- Run Oobee scans on each site in sites.csv
- Save detailed reports in the results/ directory

### 3. Generate a Summary Report

```bash
npm run generate-report
```

This will create a `report.csv` file with the following columns:

- `siteName` - Name of the site
- `mustFix` - Number of critical accessibility issues that must be fixed
- `goodToFix` - Number of accessibility issues that should be fixed
- `needsReview` - Number of items that require manual review
