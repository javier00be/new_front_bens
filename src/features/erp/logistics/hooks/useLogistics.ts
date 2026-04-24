import { useState, useEffect } from "react";
import {
    getPendingLogistics,
    getAllLogistics,
    dispatchOrder,
    deliverOrder,
} from "../services/logistics.service";
import type { LogisticOrder, DeliverDto } from "../types/logistics.type";

export const useLogistics = () => {
    const [pending, setPending] = useState<LogisticOrder[]>([]);
    const [inTransit, setInTransit] = useState<LogisticOrder[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const [pend, transit] = await Promise.all([getPendingLogistics(), getAllLogistics()]);
            setPending(pend);
            setInTransit(transit);
        } catch (error) {
            console.error("Error fetching logistics:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const dispatch = async (pedidoId: number): Promise<boolean> => {
        try {
            const updated = await dispatchOrder(pedidoId);
            setPending((prev) => prev.filter((o) => o.id !== pedidoId));
            setInTransit((prev) => [updated, ...prev]);
            return true;
        } catch (error) {
            console.error("Error dispatching order:", error);
            return false;
        }
    };

    const deliver = async (pedidoId: number, dto: DeliverDto): Promise<boolean> => {
        try {
            const updated = await deliverOrder(pedidoId, dto);
            setInTransit((prev) => prev.map((o) => (o.id === pedidoId ? updated : o)));
            return true;
        } catch (error) {
            console.error("Error delivering order:", error);
            return false;
        }
    };

    return { pending, inTransit, isLoading, fetchAll, dispatch, deliver };
};
