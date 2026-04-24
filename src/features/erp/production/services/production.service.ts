import { api } from "@/api";
import type { OrdenProduccion, CreateOrdenProduccionDto } from "../types/production.type";

export const getOrdenesProduccion = async (): Promise<OrdenProduccion[]> => {
    const response = await api.get("/production");
    return response.data;
};

export const createOrdenProduccion = async (dto: CreateOrdenProduccionDto): Promise<OrdenProduccion> => {
    const response = await api.post("/production", dto);
    return response.data;
};

export const startOrden = async (id: number): Promise<OrdenProduccion> => {
    const response = await api.patch(`/production/${id}/start`);
    return response.data;
};

export const completeOrden = async (id: number, cantidadProducida: number): Promise<OrdenProduccion> => {
    const response = await api.patch(`/production/${id}/complete`, { cantidadProducida });
    return response.data;
};

export const cancelOrden = async (id: number): Promise<OrdenProduccion> => {
    const response = await api.patch(`/production/${id}/cancel`);
    return response.data;
};
