interface FetchDgsFileDownloadUrlProps {
  resourceId: string
}

interface DownloadResponse {
  data: {
    url: string
  }
}

interface FetchDgsFileDownloadUrlOutput {
  downloadUrl: string
}

export const fetchDgsFileDownloadUrl = async ({
  resourceId,
}: FetchDgsFileDownloadUrlProps): Promise<FetchDgsFileDownloadUrlOutput | null> => {
  try {
    // For simplicity sake, we will always use data.gov.sg production API
    // The 'initiate' endpoint is less performant and has scalability limitations.
    // Therefore, it's recommended to call 'initiate' only once, then use 'poll' for subsequent checks.
    // Since multiple users may access this page, we use Promise.race to return the first available response.
    // Reference: https://opengovproducts.slack.com/archives/C05FKB7JM1U/p1754303394798019
    const baseUrl = `https://api-open.data.gov.sg/v1/public/api/datasets/${resourceId}`
    const downloadResponse = await Promise.race([
      fetch(`${baseUrl}/initiate-download`),
      fetch(`${baseUrl}/poll-download`),
    ])

    if (!downloadResponse.ok) {
      throw new Error("Failed to initiate download")
    }

    const downloadData = (await downloadResponse.json()) as DownloadResponse

    return {
      downloadUrl: downloadData.data.url,
    }
  } catch (error) {
    console.error("Error fetching DGS file download URL:", error)
    return null
  }
}
