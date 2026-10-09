import { useState, useEffect, useCallback } from "react";
import {
    getOrders,
    createOrder,
    confirmPayment,
    cancelOrder,
} from "../services/orders.service";
import type { Order, CreateOrderDto } from "../types/orders.type";

export const useOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getOrders();
            setOrders(data);
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || "Error al obtener pedidos";
            const formatted = Array.isArray(msg) ? msg.join(", ") : msg;
            setError(formatted);
            console.error("Error fetching orders:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const addOrder = async (dto: CreateOrderDto): Promise<Order> => {
        setError(null);
        try {
            const newOrder = await createOrder(dto);
            setOrders((prev) => [newOrder, ...prev]);
            return newOrder;
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || "Error al crear pedido";
            const formatted = Array.isArray(msg) ? msg.join(", ") : msg;
            setError(formatted);
            throw new Error(formatted);
        }
    };

    const payOrder = async (
        id: number,
        medioPagoId: number,
        tipoDocumentoId?: number
    ): Promise<Order> => {
        setError(null);
        try {
            const updated = await confirmPayment(id, medioPagoId, tipoDocumentoId);
            setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
            return updated;
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || "Error al confirmar pago";
            const formatted = Array.isArray(msg) ? msg.join(", ") : msg;
            setError(formatted);
            throw new Error(formatted);
        }
    };

    const cancelO = async (id: number): Promise<Order> => {
        setError(null);
        try {
            const updated = await cancelOrder(id);
            setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
            return updated;
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || "Error al cancelar pedido";
            const formatted = Array.isArray(msg) ? msg.join(", ") : msg;
            setError(formatted);
            throw new Error(formatted);
        }
    };

    return {
        orders,
        isLoading,
        error,
        fetchOrders,
        addOrder,
        payOrder,
        cancelOrder: cancelO,
    };
};
