import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const getAllItems = async (
    searchText: string = '',
    pageLimit: number,
    lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
    direction: 'forward' | 'backward' = 'forward',
  ) => {
      try {
        const lastDocParam = lastDoc ? encodeURIComponent(JSON.stringify(lastDoc)) : "";

        const response = await fetch(`${apiUrl}/get-all-items?searchText=${
            encodeURIComponent(searchText)}&pageLimit=${pageLimit}&direction=${
                direction}&lastDocParam=${lastDocParam}`);

        const result = await response.json();
        
        if (!response.ok) {
          const error = result.message || "Failed to fetch items"
          throw error
        }

        return result
      } catch (error) {
        throw error
      }
}