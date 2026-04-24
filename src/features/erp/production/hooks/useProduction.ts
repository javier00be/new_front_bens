import { useState, useEffect } from "react";
import type { OrdenProduccion, CreateOrdenProduccionDto } from "../types/production.type";
import {
    getOrdenesProduccion,
    createOrdenProduccion,
    startOrden,
    completeOrden,
    cancelOrden,
} from "../services/production.service";

export const useProduction = () => {
    const [ordenes, setOrdenes] = useState<OrdenProduccion[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => { fetchOrdenes(); }, []);

    const fetchOrdenes = async () => {
        setIsLoading(true);
        try {
            const data = await getOrdenesProduccion();
            setOrdenes(data);
        } catch (error) {
            console.error("Error fetching production orders:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const addOrden = async (dto: CreateOrdenProduccionDto): Promise<OrdenProduccion | null> => {
        try {
            const nueva = await createOrdenProduccion(dto);
            setOrdenes((prev) => [nueva, ...prev]);
            return nueva;
        } catch (error) {
            console.error("Error creating production order:", error);
            return null;
        }
    };

    const iniciarOrden = async (id: number): Promise<boolean> => {
        try {
            const updated = await startOrden(id);
            setOrdenes((prev) => prev.map((o) => (o.id === id ? updated : o)));
            return true;
        } catch (error) {
            console.error("Error starting production order:", error);
            return false;
        }
    };

    const completarOrden = async (id: number, cantidadProducida: number): Promise<boolean> => {
        try {
            const updated = await completeOrden(id, cantidadProducida);
            setOrdenes((prev) => prev.map((o) => (o.id === id ? updated : o)));
            return true;
        } catch (error) {
            console.error("Error completing production order:", error);
            return false;
        }
    };

    const cancelarOrden = async (id: number): Promise<boolean> => {
        try {
            const updated = await cancelOrden(id);
            setOrdenes((prev) => prev.map((o) => (o.id === id ? updated : o)));
            return true;
        } catch (error) {
            console.error("Error cancelling production order:", error);
            return false;
        }
    };

    return { ordenes, isLoading, fetchOrdenes, addOrden, iniciarOrden, completarOrden, cancelarOrden };
};
