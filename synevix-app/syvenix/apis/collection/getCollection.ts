import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const getCollections = async (
    searchText: string = '',
    pageLimit: number,
    filters: {status: ""},
    lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
    direction: 'forward' | 'backward' = 'forward'
) => {
      try {
        const lastDocParam = lastDoc ? encodeURIComponent(JSON.stringify(lastDoc)) : "";
        const filtersParam = filters ? encodeURIComponent(JSON.stringify(filters)) : "";

        const res = await fetch(`${apiUrl}/get-collections?searchText=${
            encodeURIComponent(searchText)}&pageLimit=${pageLimit}&direction=${
                direction}&lastDocParam=${lastDocParam}&filtersParam=${filtersParam}`);

        const data = await res.json()

        if(!res.ok){
          throw new Error(data?.message || "There was an issue fetching collections")
        }

        return data
      } catch (error) {
        throw new Error("Internal sever error")
      }
    }
