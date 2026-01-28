const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const addCollection = async (formData: FormData) => {
    try {
        const res = await fetch(`${apiUrl}/addCollection`, {
            method: "POST",
            body: formData,
        })

        const result = await res.json()

        if(!res.ok){
            const error = result?.message || "Collection was not added successfully"
            throw error
        }

        return result
    } catch (error) {
        throw error
    }
}