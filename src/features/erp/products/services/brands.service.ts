import { api } from "@/api";
import type { Brand } from "../types/Brand.type";

export const getBrands = async (): Promise<Brand[]> => {
    const response = await api.get("/brand");
    return response.data;
};

export const createBrand = async (name: string): Promise<Brand> => {
    const response = await api.post("/brand", { nombre: name });
    return response.data;
};
