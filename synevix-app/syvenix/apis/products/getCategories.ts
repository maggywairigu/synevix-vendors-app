import type { TCategory } from "@/types/category";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const fetchCategories = async () => {
      try {
        const res = await fetch(`${apiUrl}/getCategories`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch categories.");
        }

        const categoriesList: TCategory[] = [];

        data.forEach((category: TCategory) => {
          const {id, name, description, types, variations} = category;

          categoriesList.push({
            id,
            name,
            description,
            variations,
          });
        });

        return categoriesList
      } catch (err: any) {
        throw new Error(err.message || "Failed to load categories.");
      }
    };