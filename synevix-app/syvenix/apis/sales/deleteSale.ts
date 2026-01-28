const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const deleteSale = async (id: string) => {
  try {
    const res = await fetch(`${apiUrl}/delete-sale/${id}`, {
      method: 'DELETE',
    });
    
    const data = await res.json();

    if (!res.ok) {
      const error = data.message || "Sale delete was not successfull"
      throw error
    }

    return data
  } catch (error) {
    throw error
  }
}