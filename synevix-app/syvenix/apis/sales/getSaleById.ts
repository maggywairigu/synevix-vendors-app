const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const getSaleById = async (id: string) => {
  try {
      const res = await fetch(`${apiUrl}/get-sale/${id}`);
      const data = await res.json();

      if (!res.ok) {
        const error = data.message || "There was an issue getting the sale info"
        throw error
      }

      return data
  } catch (error) {
    throw error
  }
}