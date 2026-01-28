import type { TSale } from "@/types/sale";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const createSale = async (saleDetails: Partial<TSale>) => {
  try {
    // console.log("sale details: ", saleDetails)
    const res = await fetch(`${apiUrl}/createSale`, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify(saleDetails)});

      const data = await res.json()
  
      if(!res.ok){
        const error = data.message || "There was an issue creating sale";
        throw error
      }
      
      return data
  } catch (error) {
    throw error
  }
}