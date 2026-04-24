import { api } from "@/api";
import type { InventoryItem, UpdateStockDto } from "../types/inventory.type";

export const getInventory = async (): Promise<InventoryItem[]> => {
    const response = await api.get("/inventory");
    return Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
};

export const updateStock = async (id: number, dto: UpdateStockDto): Promise<InventoryItem> => {
    const response = await api.patch(`/inventory/${id}`, dto);
    return response.data;
};

export const getInventoryByProduct = async (productoId: number): Promise<InventoryItem[]> => {
    const response = await api.get(`/inventory/product/${productoId}`);
    return Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
};

export const deleteInventoryItem = async (id: number): Promise<void> => {
    await api.delete(`/inventory/${id}`);
};
