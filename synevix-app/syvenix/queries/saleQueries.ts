import { useInfiniteQuery } from "@tanstack/react-query";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import type { TSale } from "@/types/sale";
import { getAllSaleOrders } from "../apis/sales/getAllSales";
import { getSaleById } from "@/apis/sales/getSaleById";

interface UseGetSaleOptions {
  searchText?: string;
  pageLimit: number;
}

interface TSalesReturns {
  sales: TSale[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  isAtTheEnd: boolean;
}

export const useGetAllSaleOrders = ({
  searchText,
  pageLimit,
}: UseGetSaleOptions) => {
  return useInfiniteQuery<TSalesReturns, Error>({
    queryKey: ["get-sales", searchText, pageLimit],
    queryFn: async (params) => {
      const data = await getAllSaleOrders(
        searchText,
        pageLimit,
        params.pageParam
      );
      return data;
    },
    initialPageParam: undefined,
    getPreviousPageParam: (params) => params?.lastVisible || undefined,
    getNextPageParam: (params) => params?.lastVisible || undefined,
    refetchOnWindowFocus: false,
  });
};

export const useGetSaleById = (id: string)=>{
    return useInfiniteQuery<any, Error>({
        queryKey: ['get-sale', id],
        queryFn: async (params) => {
            // Pass the lastDoc as pageParam for pagination
            const data = await getSaleById(id)
            return data
        },
        initialPageParam: undefined,
        getPreviousPageParam: (params) => params?.lastDoc || undefined,
        getNextPageParam: (params) => params?.lastDoc || undefined,
    })
}
