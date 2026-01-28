import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import type { TAccount } from "@/types/account"

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const addAccount = async (values:TAccount) => {
    try {
        const res = await fetch(`${apiUrl}/addAccount`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(values)
        })

        const result = await res.json()

        if(!res.ok){
            const error = result?.message || "Account was not added successfully"
            throw error
        }

        return result
    } catch (error) {
        throw error
    }
}