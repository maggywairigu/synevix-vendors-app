export interface TProduct {
    sku: string
    type: string
    name: string
    addOn: string | number
    buying_currency: string
    buying_price: string | number
    createdAt: Timestamp
    description: string
    images: Array
    label: string
    market_price: string | number
    name: string
    productId: string
    profit: number | string
    profit_in: string
    selling_price: number | string
    spoiled: number
    status: string
    stock: number
    type: string
    updatedAt: Timestamp
}