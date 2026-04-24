import { api } from "@/api";
import type { SizeResponse } from "../types/size.type";

export const getSizes = async (): Promise<SizeResponse[]> => {
    const response = await api.get("/size");
    return response.data;
};

export const createSize = async (nombre: string): Promise<SizeResponse> => {
    const response = await api.post("/size", { nombre });
    return response.data;
};
