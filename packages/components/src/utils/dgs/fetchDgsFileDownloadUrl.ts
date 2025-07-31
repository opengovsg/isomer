interface FetchDgsFileDownloadUrlProps {
  dgsId: string
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
  dgsId,
}: FetchDgsFileDownloadUrlProps): Promise<FetchDgsFileDownloadUrlOutput | null> => {
  const initiateDownloadUrl = getInitiateDownloadUrl(dgsId)

  try {
    const initiateDownloadResponse = await fetch(initiateDownloadUrl)

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

const getInitiateDownloadUrl = (dgsId: FetchDgsFileDownloadUrlProps["dgsId"]) =>
  `https://api-open.data.gov.sg/v1/public/api/datasets/${dgsId}/initiate-download`
