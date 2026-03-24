export const fetchWithRetry = async (url: string, retry = 5) => {
  for (let attempt = 1; attempt <= retry; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok || response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (attempt === retry) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 10000 * attempt));
    }
  }
};
