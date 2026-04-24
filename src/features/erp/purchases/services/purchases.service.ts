import { api } from "@/api";
import type { Purchase, CreatePurchaseDto } from "../types/purchases.type";

export const getPurchases = async (): Promise<Purchase[]> => {
    const response = await api.get("/purchases");
    return response.data;
};

export const getPurchaseById = async (id: number): Promise<Purchase> => {
    const response = await api.get(`/purchases/${id}`);
    return response.data;
};

export const createPurchase = async (dto: CreatePurchaseDto): Promise<Purchase> => {
    const response = await api.post("/purchases", dto);
    return response.data;
};

export const anularPurchase = async (id: number): Promise<Purchase> => {
    const response = await api.patch(`/purchases/${id}/anular`);
    return response.data;
};
