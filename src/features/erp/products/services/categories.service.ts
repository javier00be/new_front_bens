import { api } from "@/api";
import type { Category } from "../types/Categories.type";

export const getCategories = async (): Promise<Category[]> => {
    const response = await api.get("/categories");
    return response.data;
};

export const createCategory = async (name: string): Promise<Category> => {
    const response = await api.post("/categories", { nombre: name });
    return response.data;
};
