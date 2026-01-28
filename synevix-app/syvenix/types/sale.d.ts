import { Timestamp } from "firebase-admin/firestore"
import type { TProduct } from "./product"

export interface TSale {
  id: string,
  saleId: string,
  orderType: string,
  totalQuantity: number,
  totalRate: number,
  totalAmount: number,
  payments: Array,
  paymentTerms: string,
  amountPending: number,
  amountPaid: number,
  note: string,
  salesPerson: string,
  status: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  deliveryLocation: string,
  deliveryMethod: string,
  courier: string,
  deliveryFee: number,
  errandFee: number
  customerName?: string
  phoneNumber?: string
  email?:string
  items: TProduct[]
}