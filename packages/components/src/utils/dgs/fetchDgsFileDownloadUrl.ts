interface FetchDgsFileDownloadUrlProps {
  resourceId: string
}

interface InitiateDownloadResponse {
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
    const initiateDownloadResponse = await fetch(
      `https://api-open.data.gov.sg/v1/public/api/datasets/${resourceId}/initiate-download`,
    )

    if (!initiateDownloadResponse.ok) {
      throw new Error("Failed to initiate download")
    }

    const initiateDownloadData =
      (await initiateDownloadResponse.json()) as InitiateDownloadResponse

    return {
      downloadUrl: initiateDownloadData.data.url,
    }
  } catch (error) {
    console.error("Error fetching DGS file download URL:", error)
    return null
  }
}
