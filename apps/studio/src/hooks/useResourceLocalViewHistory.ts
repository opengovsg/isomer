const LOCAL_VIEW_HISTORY_KEY = "localViewHistory"

interface LocalViewHistory {
  resourceId: string
  dateTime: Date
}

export const useResourceLocalViewHistory = ({ siteId }: { siteId: string }) => {
  const storageKeyForSiteId = `${LOCAL_VIEW_HISTORY_KEY}-${siteId}`

  const get = (): LocalViewHistory[] => {
    let history: LocalViewHistory[] = []
    const storedHistory = localStorage.getItem(storageKeyForSiteId)

    if (storedHistory) {
      try {
        history = JSON.parse(storedHistory) as LocalViewHistory[]
      } catch (error) {
        console.error("Failed to parse local view history from storage:", error)
      }
    }
    return history
  }

  const upsert = ({ resourceId }: { resourceId: string }): void => {
    const localViewHistory: LocalViewHistory[] = get()

    const existingEntryIndex: number = localViewHistory.findIndex(
      (entry) => entry.resourceId === resourceId,
    )

    const entryToUpdate: LocalViewHistory | undefined =
      localViewHistory[existingEntryIndex]

    if (entryToUpdate) {
      // Remove the existing entry
      localViewHistory.splice(existingEntryIndex, 1)
    }
    // Add the new entry to the beginning of the array
    localViewHistory.unshift({ resourceId, dateTime: new Date() })

    // Limit history to 10 items by removing older entries
    // 10 is a arbitrary number to ensure localStorage doesn't get too big
    localViewHistory.splice(10)

    localStorage.setItem(storageKeyForSiteId, JSON.stringify(localViewHistory))
  }

  return { get, upsert }
}
