const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const getCollection = async (id: string) => {
    try {
        const res = await fetch(`${apiUrl}/get-collection?id=${id}`)

        const result = await res.json()

        if(!res.ok){
            throw new Error(result.message || "There was an issue fetching collection")
        }

        return result
    } catch (error) {
        throw error
    }
}