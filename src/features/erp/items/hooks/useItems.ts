import { useState, useEffect } from "react";
import { getItems, createItem, updateItem, deleteItem } from "../services/items.service";
import type { Item, CreateItemDto } from "../types/items.type";

export const useItems = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const data = await getItems();
            setItems(data);
        } catch {
            // caller handles error display
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    const addItem = async (dto: CreateItemDto): Promise<Item | null> => {
        try {
            const created = await createItem(dto);
            setItems(prev => [created, ...prev]);
            return created;
        } catch {
            return null;
        }
    };

    const editItem = async (id: number, dto: Partial<CreateItemDto>): Promise<Item | null> => {
        try {
            const updated = await updateItem(id, dto);
            setItems(prev => prev.map(i => i.id === id ? updated : i));
            return updated;
        } catch {
            return null;
        }
    };

    const removeItem = async (id: number): Promise<boolean> => {
        try {
            await deleteItem(id);
            setItems(prev => prev.filter(i => i.id !== id));
            return true;
        } catch {
            return false;
        }
    };

    return { items, isLoading, fetchItems, addItem, editItem, removeItem };
};
