import { useState } from "react";
import type { RecipeItem, CreateRecipeItemDto } from "../types/recipes.type";
import { getRecipeByProduct, addRecipeItem, deleteRecipeItem } from "../services/recipes.service";

export const useRecipes = () => {
    const [items, setItems] = useState<RecipeItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchRecipe = async (productoId: number) => {
        setIsLoading(true);
        try {
            const data = await getRecipeByProduct(productoId);
            setItems(data);
        } catch (error) {
            console.error("Error fetching recipe:", error);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    const addItem = async (dto: CreateRecipeItemDto): Promise<RecipeItem | null> => {
        try {
            const newItem = await addRecipeItem(dto);
            setItems(prev => [...prev, newItem]);
            return newItem;
        } catch (error) {
            console.error("Error adding recipe item:", error);
            return null;
        }
    };

    const removeItem = async (id: number): Promise<boolean> => {
        try {
            await deleteRecipeItem(id);
            setItems(prev => prev.filter(i => i.id !== id));
            return true;
        } catch (error) {
            console.error("Error deleting recipe item:", error);
            return false;
        }
    };

    return { items, isLoading, fetchRecipe, addItem, removeItem };
};
