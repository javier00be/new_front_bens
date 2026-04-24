import { api } from "@/api";
import type { Supplier, CreateSupplierDto } from "../types/suppliers.type";

export const getSuppliers = async (): Promise<Supplier[]> => {
    const response = await api.get("/suppliers");
    return response.data;
};

export const createSupplier = async (dto: CreateSupplierDto): Promise<Supplier> => {
    const response = await api.post("/suppliers", dto);
    return response.data;
};

export const updateSupplier = async (id: number, dto: Partial<CreateSupplierDto>): Promise<Supplier> => {
    const response = await api.patch(`/suppliers/${id}`, dto);
    return response.data;
};

export const deleteSupplier = async (id: number): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
};
