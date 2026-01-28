import { useInfiniteQuery, type UseInfiniteQueryOptions } from "@tanstack/react-query"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import type { TCollections } from "@/types/collection"
import { getCollection } from "@/apis/collection/getCollectionById"
import { getCollections } from "@/apis/collection/getCollection"

export const useGetCollection = (id: string, 
    options?: Omit<
    UseInfiniteQueryOptions<any, Error>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'getPreviousPageParam'
  >
)=>{
    return useInfiniteQuery<any, Error>({
        queryKey: ['get-collection', id],
        queryFn: async (params) => {
            // Pass the lastDoc as pageParam for pagination
            const data = await getCollection(id)
            console.log("Any id here", id)
            return data
        },
        initialPageParam: undefined,
        getPreviousPageParam: (params) => params?.lastDoc || undefined,
        getNextPageParam: (params) => params?.lastDoc || undefined,
        ...options,
    })
}

interface UseGetCollectionsOptions {
    searchText?: string
    pageLimit: number
}

interface TCollectionsReturns {
    collections: TCollections[]
    isAtEnd: boolean
    lastDoc: {
        lastVisible: QueryDocumentSnapshot<DocumentData> | null
        firstVisible: QueryDocumentSnapshot<DocumentData> | null
        isAtTheEnd: boolean
    }
}

export const useGetAllCollections = ({
    searchText,
    pageLimit
}: UseGetCollectionsOptions) => {
    return useInfiniteQuery<TCollectionsReturns, Error>({
        queryKey: ['get-collections', searchText, pageLimit],
        queryFn: async ({pageParam}) => {
            const data = await getCollections(
                searchText,
                pageLimit,
                pageParam
            )
            return data
        },
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => {
            return lastPage.lastDoc.isAtTheEnd ? undefined : lastPage.lastDoc.lastVisible
        },
    })
}