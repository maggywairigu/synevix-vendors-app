import type { Timestamp } from "firebase/firestore";
import type { TProduct } from "./product";

export interface TCollections {
    createdAt: Timestamp
    description: string
    discount: number
    finalPrice: number
    id: string
    name: string
    status: string
    subtotal: number
    items: TProduct[]
}