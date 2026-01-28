import { useInfiniteQuery } from "@tanstack/react-query"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import type { TAccount } from "@/types/account"
import { getAllAccounts } from "@/apis/accounts/getAllAccounts"
import { getAllExpenseAccounts } from "@/apis/accounts/getAllExpenseAccounts"

interface UseGetAccountsOptions {
    searchText?: string
    pageLimit: number
    filters: {
        status: string,
        //type: string
    }
}

interface TAccountsReturns {
    accounts: TAccount[]
    isAtTheEnd: boolean
    lastDoc: {
        lastVisible: QueryDocumentSnapshot<DocumentData> | null
        firstVisible: QueryDocumentSnapshot<DocumentData> | null
        isAtTheEnd: boolean
    }
}

export const useGetAllAccounts = ({
    searchText,
    pageLimit,
    filters
}: UseGetAccountsOptions) => {
    return useInfiniteQuery<TAccountsReturns, Error>({
        queryKey: ['get-accounts', searchText, pageLimit, filters],
        queryFn: async (params) => {
            //console.log("Filters", filters)
            // Pass the lastDoc as pageParam for pagination
            const data = await getAllAccounts(
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

interface UseGetExpenseAccountsOptions {
    searchText?: string
    pageLimit: number
    filters: {
        status: string,
        //type: string
    }
}

interface TExpenseAccountsReturns {
    accounts: TAccount[]
    isAtTheEnd: boolean
    lastDoc: {
        lastVisible: QueryDocumentSnapshot<DocumentData> | null
        firstVisible: QueryDocumentSnapshot<DocumentData> | null
        isAtTheEnd: boolean
    }
}

export const useGetAllExpenseAccounts = ({
    searchText,
    pageLimit,
    filters
}: UseGetExpenseAccountsOptions) => {
    return useInfiniteQuery<TExpenseAccountsReturns, Error>({
        queryKey: ['get-expense-accounts', searchText, pageLimit, filters],
        queryFn: async (params) => {
            //console.log("Filters", filters)
            // Pass the lastDoc as pageParam for pagination
            const data = await getAllExpenseAccounts(
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