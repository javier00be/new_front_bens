import { api } from "@/api";
import type { Order, CreateOrderDto, MedioPago, TipoDocumento } from "../types/orders.type";

export const getOrders = async (): Promise<Order[]> => {
    const response = await api.get("/orders");
    return response.data;
};

export const getOrderById = async (id: number): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
};

export const createOrder = async (dto: CreateOrderDto): Promise<Order> => {
    const response = await api.post("/orders", dto);
    return response.data;
};

export const confirmPayment = async (
    id: number,
    medioPagoId: number,
    tipoDocumentoId?: number
): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/pay`, { medioPagoId, tipoDocumentoId });
    return response.data;
};

export const cancelOrder = async (id: number): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/cancel`);
    return response.data;
};

export const getMediosPago = async (): Promise<MedioPago[]> => {
    const response = await api.get("/payment-method");
    return response.data;
};

export const getTiposDocumento = async (): Promise<TipoDocumento[]> => {
    const response = await api.get("/type-document");
    return response.data;
};
