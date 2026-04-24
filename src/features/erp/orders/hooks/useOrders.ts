import { useState, useEffect } from "react";
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

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const data = await getOrders();
            setOrders(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const addOrder = async (dto: CreateOrderDto): Promise<Order | null> => {
        try {
            const newOrder = await createOrder(dto);
            setOrders((prev) => [newOrder, ...prev]);
            return newOrder;
        } catch (error) {
            console.error("Error creating order:", error);
            return null;
        }
    };

    const payOrder = async (
        id: number,
        medioPagoId: number,
        tipoDocumentoId?: number
    ): Promise<Order | null> => {
        try {
            const updated = await confirmPayment(id, medioPagoId, tipoDocumentoId);
            setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
            return updated;
        } catch (error) {
            console.error("Error confirming payment:", error);
            return null;
        }
    };

    const cancelO = async (id: number): Promise<Order | null> => {
        try {
            const updated = await cancelOrder(id);
            setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
            return updated;
        } catch (error) {
            console.error("Error cancelling order:", error);
            return null;
        }
    };

    return { orders, isLoading, fetchOrders, addOrder, payOrder, cancelOrder: cancelO };
};
