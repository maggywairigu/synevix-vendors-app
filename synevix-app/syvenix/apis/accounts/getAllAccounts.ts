import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import type { TAccount } from "@/types/account"

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const getAllAccounts = async (
    searchText: string = '',
    pageLimit: number,
    filters: {status: ""},
    lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
    direction: 'forward' | 'backward' = 'forward',
) => {
      try {
        const lastDocParam = lastDoc ? encodeURIComponent(JSON.stringify(lastDoc)) : "";
        const filtersParam = filters ? encodeURIComponent(JSON.stringify(filters)) : "";

        const response = await fetch(`${apiUrl}/getAllAccounts?searchText=${
            encodeURIComponent(searchText)}&pageLimit=${pageLimit}&direction=${
                direction}&lastDocParam=${lastDocParam}&filtersParam=${filtersParam}`);

        const result = await response.json();
        if (!response.ok) {
          const error = result.message || "Failed to fetch accounts"
          throw error
        }

        return result
      } catch (error) {
        throw error
      }
    }