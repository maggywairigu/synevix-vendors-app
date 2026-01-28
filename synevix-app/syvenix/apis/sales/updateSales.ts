import type { TSale } from "@/types/sale";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const updateSale = async (id: string, formData: TSale) => {
  try {
    const response = await fetch(`${apiUrl}/update-sale/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
      
    const result = await response.json();

    if (!response.ok) {
      const error = result.message || "Sale update failed";
      throw error
    };

    return result
  } catch (error) {
    throw error
  }
}