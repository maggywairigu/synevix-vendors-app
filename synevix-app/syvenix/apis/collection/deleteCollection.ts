const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const deleteCollection = async (id: string) => {
    try {
        const res = await fetch(`${apiUrl}/delete-collection?id=${id}`, {
            method: 'DELETE'
        })

        const result = await res.json()

        if(!res.ok){
            console.log("Error: ", result?.message)
            throw new Error(`Collection was not deleted successfully`)
        }

        return result
    } catch (error) {
        throw error
    }
}