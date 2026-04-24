import { api } from "@/api";
import type { Sale } from "../types/sales.type";

export const getSales = async (): Promise<Sale[]> => {
    const response = await api.get("/sales");
    return response.data;
};

export const getSaleById = async (id: number): Promise<Sale> => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
};

export const deleteSale = async (id: number): Promise<void> => {
    await api.delete(`/sales/${id}`);
};
