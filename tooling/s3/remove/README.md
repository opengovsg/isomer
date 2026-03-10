# S3 Asset Removal Script

Bulk removes files from the S3 assets bucket and invalidates the CloudFront cache.

## Prerequisites

- AWS CLI configured with appropriate credentials (AWS_PROFILE=isomer-production)
- `jq` installed for JSON processing

## Usage

1. Create an `items.csv` file in this directory with one S3 key per line:

   ```
   /path/to/file1.jpg
   /path/to/file2.png
   ```

2. Run the script:

   ```bash
   ./remove.sh
   ```

3. The script will:
   - Perform a **dry run** showing what will be deleted
   - Prompt for confirmation before proceeding
   - Delete the files from S3
   - Create a CloudFront invalidation for all paths

## Configuration

| Variable        | Description                                                      |
| --------------- | ---------------------------------------------------------------- |
| `BUCKET`        | S3 bucket name (`isomer-next-infra-prod-assets-private-a319984`) |
| `CSV_FILE`      | Path to the file list (default: `./items.csv`)                   |
| Distribution ID | CloudFront distribution: `E3HKKQ90VH6MLT`                        |

## Cost Considerations

CloudFront charges **$0.005 per invalidation path** after the first 1,000 free paths per month. See [CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/pay-as-you-go/) for details.

The script batches all paths into a single invalidation request to minimize API calls.
