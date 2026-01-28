import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const getProducts = async (
    searchText: string = '',
    pageLimit: number,
    filters: {sku: string, type: string},
    lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
    direction: 'forward' | 'backward' = 'forward',
) => {
      try {
        const lastDocParam = lastDoc ? encodeURIComponent(JSON.stringify(lastDoc)) : "";
        const filtersParam = filters ? encodeURIComponent(JSON.stringify(filters)) : "";

        const response = await fetch(`${apiUrl}/getAllProducts?searchText=${
            encodeURIComponent(searchText)}&pageLimit=${pageLimit}&direction=${
                direction}&lastDocParam=${lastDocParam}&filtersParam=${filtersParam}`);

        const result = await response.json();
        if (!response.ok) {
          const error = result.message || "Failed to fetch products"
          throw error
        }

        return result
      } catch (error) {
        throw error
      }
    }