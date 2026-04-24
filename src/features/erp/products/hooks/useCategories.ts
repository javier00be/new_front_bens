import { useState, useEffect } from "react";
import { getCategories, createCategory } from "../services/categories.service";

export interface CategoryOption {
    value: string;
    label: string;
}

export const useCategories = () => {
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getCategories();
                setCategories(data.map(item => ({ value: String(item.id), label: item.nombre })));
            } catch {
                // silently fail — categories will be empty
            } finally {
                setIsLoadingCategories(false);
            }
        };
        load();
    }, []);

    const addCategoryToAPI = async (name: string): Promise<CategoryOption | null> => {
        try {
            const created = await createCategory(name);
            const option = { value: String(created.id), label: created.nombre };
            setCategories(prev => [...prev, option]);
            return option;
        } catch {
            return null;
        }
    };

    return { categories, isLoadingCategories, addCategoryToAPI };
};
