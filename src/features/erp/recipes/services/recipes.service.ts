import { api } from "@/api";
import type { RecipeItem, CreateRecipeItemDto } from "../types/recipes.type";

export const getRecipeByProduct = async (productoId: number): Promise<RecipeItem[]> => {
    try {
        const response = await api.get(`/recipes/product/${productoId}`);
        return response.data;
    } catch {
        return [];
    }
};

export const addRecipeItem = async (dto: CreateRecipeItemDto): Promise<RecipeItem> => {
    const response = await api.post("/recipes", dto);
    return response.data;
};

export const deleteRecipeItem = async (id: number): Promise<void> => {
    await api.delete(`/recipes/${id}`);
};
