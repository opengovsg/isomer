# Isomer Site Launch Tool

An automated tool for launching Isomer sites that handles SSL certificate generation, search integration, GitHub configuration, and DNS record creation.

## Overview

This tool streamlines the process of launching a new Isomer site by automating several key tasks:

- **SSL Certificate Management**: Request and configure SSL certificates via AWS ACM
- **Search Integration**: Set up SearchSG clients for site search functionality
- **GitHub Configuration**: Update site configuration and create search pages
- **Database Migration**: Migrate GitHub repository content to Studio (for GitHub sites)
- **DNS Configuration**: Generate DNS indirection records via pull requests

## Prerequisites

Before using this tool, ensure you have:

1. **AWS CLI configured** with appropriate credentials
2. **AWS SSO login** completed (`aws sso login`)
3. **Environment variables** set:
   - `AWS_PROFILE`: Your AWS profile name
   - `SEARCHSG_API_KEY`: API key for SearchSG integration. This is the base64 of the
   - `GITHUB_TOKEN`: GitHub personal access token with repo permissions
   - `S3_BUCKET_URI`: The URI of the s3 bucket to upload to after the assets are migrated onto Studio
   - `PUBLISHER_USER_ID`: This is the user ID of the user to assign as the publisher of all pages
   - `DATABASE_URL`: This is the database connection string to the Studio database
4. **Database connection** (for GitHub sites): Run `npm run db:connect` in the main project
5. **Permissions**: Access to AWS ACM, CloudFront, and GitHub repositories

## Installation

```bash
cd /path/to/isomer/tooling/site-launch
npm install
```

## Usage

### Start the Site Launch Process

```bash
npm run launch
```

The tool will guide you through an interactive process:

### 1. AWS Profile Confirmation

- Confirms your current `$AWS_PROFILE`
- Ensures you've run `aws sso login`

### 2. Domain Configuration

- Enter the full domain name (e.g., `www.example.gov.sg`)
- Choose whether to generate an SSL certificate

### 3. SSL Certificate Generation (Optional)

If you need an SSL certificate:

- Automatically requests certificate via AWS ACM
- Generates DNS validation records
- Creates a `.ssl.conf` file with validation details
- **Important**: Copy the DNS records to ProdOps before proceeding
- Automatically deletes the temporary certificate after confirmation

### 4. Site Information

- Enter the site's long name
- Provide the CodeBuild project name (e.g., `ogp-corp`)

### 5. Site Type Selection

Choose between:

- **GitHub Site**: Existing GitHub repository
- **Studio Site**: Site created in Isomer Studio

#### For GitHub Sites:

- Enter the GitHub repository name
- Automatic site configuration updates
- Database migration from repository
- Optional asset cleanup

#### For Studio Sites:

- Enter the brand color hex value
- Manual configuration file generation
- Requires manual database updates

### 6. DNS Indirection

- Automatically finds the corresponding CloudFront distribution
- Generates DNS record configuration
- Creates a pull request in the `isomer-indirection` repository

## File Structure

```
tooling/site-launch/
  - index.ts                   # Main entry point and workflow orchestration
  - create-searchsg-client.ts  # SearchSG API integration
  - request-acm.ts             # SSL certificate management
  - indirection.ts             # DNS record generation
  - github.ts                  # GitHub API operations
  - utils.ts                   # Utility functions
  - search.json                # Search page template
  - package.json               # Dependencies and scripts
```

## Key Functions

### SSL Certificate Management (`request-acm.ts`)

- Requests certificates from AWS ACM in `us-east-1` region
- Retrieves DNS validation records
- Saves configuration to disk as backup
- Automatically cleans up temporary certificates

### SearchSG Integration (`create-searchsg-client.ts`)

- Creates SearchSG applications via API
- Configures search themes and indexing
- Updates site configurations automatically
- Generates search pages for GitHub sites

### GitHub Operations (`github.ts`)

- Commits to staging branches
- Updates site configuration files
- Creates automated pull requests
- Adds search.json templates

### DNS Configuration (`indirection.ts`)

- Finds CloudFront distributions by CodeBuild ID
- Generates Pulumi DNS record configurations
- Creates pull requests for DNS changes

## Output Files

The tool generates several files during operation:

- `{domain}.ssl.conf`: SSL certificate validation records
- `{domain}.search.json`: SearchSG configuration (Studio sites)
- `{domain}.url.json`: Site URL configuration (Studio sites)

## Important Notes

1. **SSL Certificates**: Always copy DNS validation records to ProdOps before allowing the tool to delete temporary certificates
2. **Manual Steps**: Some configuration updates require manual database changes for Studio sites
3. **Pull Requests**: The tool creates automated PRs that require engineer approval
4. **Cleanup**: Asset cleanup for GitHub sites is optional but recommended
5. **Region**: SSL certificates are always requested in `us-east-1` for CloudFront compatibility

## Troubleshooting

### Common Issues

1. **AWS Profile**: Ensure `$AWS_PROFILE` is set and you've run `aws sso login`
2. **GitHub Token**: Verify your `GITHUB_TOKEN` has sufficient permissions
3. **Database Connection**: Ensure database connectivity for GitHub site migrations

### Error Messages

- `No AWS_PROFILE found`: Set the `AWS_PROFILE` environment variable
- `Invalid URL: expected protocol to be 'https'`: Ensure domains start with `https://`
- `Expected 1 cloudfront distribution... but found none`: Verify CodeBuild ID matches existing infrastructure

## Support

For issues or questions:

1. Check that all prerequisites are met
2. Verify environment variables are correctly set
3. Ensure you have appropriate AWS and GitHub permissions
4. Contact the Isomer engineering team for further assistance
