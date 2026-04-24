import { useState, useEffect } from "react";
import type { Purchase, CreatePurchaseDto } from "../types/purchases.type";
import { getPurchases, createPurchase, anularPurchase } from "../services/purchases.service";

export const usePurchases = () => {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchPurchases = async () => {
        setIsLoading(true);
        try {
            const data = await getPurchases();
            setPurchases(data);
        } catch {
            // caller handles error display
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchPurchases(); }, []);

    const addPurchase = async (dto: CreatePurchaseDto): Promise<Purchase | null> => {
        try {
            const created = await createPurchase(dto);
            setPurchases(prev => [created, ...prev]);
            return created;
        } catch {
            return null;
        }
    };

    const cancelPurchase = async (id: number): Promise<Purchase | null> => {
        try {
            const updated = await anularPurchase(id);
            setPurchases(prev => prev.map(p => p.id === id ? updated : p));
            return updated;
        } catch {
            return null;
        }
    };

    return { purchases, isLoading, fetchPurchases, addPurchase, cancelPurchase };
};
