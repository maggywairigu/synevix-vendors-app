export interface TAccount {
    id: string,
    type: string,
    bankName: string,
    name: string,
    accountNumber: string,
    balance: number,
    currency: string,
    status: string,
    overdraftLimit: number,
    description: string,
    isPrimary: boolean
}