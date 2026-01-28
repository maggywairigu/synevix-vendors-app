import { useInfiniteQuery } from "@tanstack/react-query"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import type { TProduct } from "@/types/product"
import type { TSale } from "@/types/sale"
import { getAllItems } from "@/apis/products/getAllTimes"
import { getProducts } from "@/apis/products/getProducts"

interface UseGetProductsOptions {
    searchText?: string
    pageLimit: number
    filters: {
        sku: string,
        type: string
    }
}

interface TProductsReturns {
    products: TProduct[]
    isAtTheEnd: boolean
    lastDoc: {
        lastVisible: QueryDocumentSnapshot<DocumentData> | null
        firstVisible: QueryDocumentSnapshot<DocumentData> | null
        isAtTheEnd: boolean
    }
}

export const useGetProducts = ({
    searchText,
    pageLimit,
    filters
}: UseGetProductsOptions) => {
    return useInfiniteQuery<TProductsReturns, Error>({
        queryKey: ['get-products', searchText, pageLimit, filters],
        queryFn: async (params) => {
            //console.log("Filters", filters)
            // Pass the lastDoc as pageParam for pagination
            const data = await getProducts(
                searchText,
                pageLimit,
                filters,
                params.pageParam
            )
            return data
        },
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => {
        // return undefined if you’re at the end
        return lastPage.lastDoc.isAtTheEnd ? undefined : lastPage.lastDoc.lastVisible
        },
    })
}

interface UseGetItemsOptions {
    searchText?: string
    pageLimit: number
}

interface TItemsReturns {
    items: TProduct[]
    isAtTheEnd: boolean
    lastDoc: {
        lastVisible: QueryDocumentSnapshot<DocumentData> | null
        firstVisible: QueryDocumentSnapshot<DocumentData> | null
        isAtTheEnd: boolean
    }
}

export const useGetItems = ({
    searchText,
    pageLimit,
}: UseGetItemsOptions) => {
    return useInfiniteQuery<TItemsReturns, Error>({
        queryKey: ['get-items', searchText, pageLimit],
        queryFn: async ({pageParam}) => {
            // Pass the lastDoc as pageParam for pagination
            const data = await getAllItems(
                searchText,
                pageLimit,
                pageParam
            )
            return data
        },
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => {
        // return undefined if you’re at the end
        return lastPage.lastDoc.isAtTheEnd ? undefined : lastPage.lastDoc.lastVisible
        },
    })
}