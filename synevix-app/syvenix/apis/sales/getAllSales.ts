import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import type { TSale } from "@/types/sale";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const getAllSaleOrders = async (
  searchText: string = "",
  pageLimit: number,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  direction: "forward" | "backward" = "forward"
) => {
  try {
    const lastDocParam = lastDoc
      ? encodeURIComponent(JSON.stringify(lastDoc))
      : "";


    const res = await fetch(
      `${apiUrl}/get-all-sales?searchText=${encodeURIComponent(
        searchText
      )}&pageLimit=${pageLimit}&direction=${direction}&lastDocParam=${lastDocParam}`
    );

    const data = await res.json();


    if (!res.ok) {
      const error = data.message || "Failed to fetch customers.";
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};
