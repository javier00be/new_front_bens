import { api } from "@/api";
import type { Item, CreateItemDto } from "../types/items.type";

export const getItems = async (): Promise<Item[]> => {
    const response = await api.get("/items");
    return response.data;
};

export const createItem = async (dto: CreateItemDto): Promise<Item> => {
    const response = await api.post("/items", dto);
    return response.data;
};

export const updateItem = async (id: number, dto: Partial<CreateItemDto>): Promise<Item> => {
    const response = await api.patch(`/items/${id}`, dto);
    return response.data;
};

export const deleteItem = async (id: number): Promise<void> => {
    await api.delete(`/items/${id}`);
};
