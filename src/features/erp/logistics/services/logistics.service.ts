import { api } from "@/api";
import type { LogisticOrder, DeliverDto } from "../types/logistics.type";

export const getPendingLogistics = async (): Promise<LogisticOrder[]> => {
    const response = await api.get("/logistics/pending");
    return response.data;
};

export const getAllLogistics = async (): Promise<LogisticOrder[]> => {
    const response = await api.get("/logistics");
    return response.data;
};

export const dispatchOrder = async (pedidoId: number): Promise<LogisticOrder> => {
    const response = await api.patch(`/logistics/dispatch/${pedidoId}`);
    return response.data;
};

export const deliverOrder = async (pedidoId: number, dto: DeliverDto): Promise<LogisticOrder> => {
    const response = await api.patch(`/logistics/deliver/${pedidoId}`, dto);
    return response.data;
};
