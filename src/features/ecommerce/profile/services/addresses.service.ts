import { api } from "@/api";

export interface Address {
    id: number;
    clienteId: number;
    alias: string;
    direccion: string;
    distrito: string;
    provincia: string;
    departamento: string;
    referencia?: string | null;
    esPrincipal: boolean;
    createdAt?: string;
}

export interface CreateAddressDto {
    alias: string;
    direccion: string;
    distrito: string;
    provincia: string;
    departamento: string;
    referencia?: string;
    esPrincipal?: boolean;
}

export const getMyAddresses = async (): Promise<Address[]> => {
    const { data } = await api.get("/addresses");
    return data;
};

export const createAddress = async (dto: CreateAddressDto): Promise<Address> => {
    const { data } = await api.post("/addresses", dto);
    return data;
};

export const setPrimaryAddress = async (id: number): Promise<void> => {
    await api.patch(`/addresses/${id}/primary`);
};

export const deleteAddress = async (id: number): Promise<void> => {
    await api.delete(`/addresses/${id}`);
};
