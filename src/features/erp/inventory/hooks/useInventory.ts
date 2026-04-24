import { useState, useCallback } from "react";
import type { InventoryItem, UpdateStockDto } from "../types/inventory.type";
import { getInventory, updateStock, deleteInventoryItem } from "../services/inventory.service";

export const useInventory = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchInventory = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getInventory();
            setInventory(data);
        } catch (error) {
            console.error("Error al obtener inventario:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateItemStock = async (id: number, dto: UpdateStockDto): Promise<boolean> => {
        try {
            const updated = await updateStock(id, dto);
            setInventory(prev => prev.map(item => item.id === id ? updated : item));
            return true;
        } catch (error) {
            console.error("Error al actualizar stock:", error);
            return false;
        }
    };

    const removeInventoryItem = async (id: number): Promise<boolean> => {
        try {
            await deleteInventoryItem(id);
            setInventory(prev => prev.filter(item => item.id !== id));
            return true;
        } catch (error) {
            console.error("Error al dar de baja variante:", error);
            return false;
        }
    };

    // Stock total agrupado por producto
    const stockByProduct = inventory.reduce<Record<number, number>>((acc, item) => {
        acc[item.productoId] = (acc[item.productoId] ?? 0) + item.stock;
        return acc;
    }, {});

    return { inventory, isLoading, fetchInventory, updateItemStock, removeInventoryItem, stockByProduct };
};
