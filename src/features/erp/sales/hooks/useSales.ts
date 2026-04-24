import { useState, useEffect } from "react";
import { getSales, deleteSale } from "../services/sales.service";
import type { Sale } from "../types/sales.type";

export const useSales = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => { fetchSales(); }, []);

    const fetchSales = async () => {
        setIsLoading(true);
        try {
            const data = await getSales();
            setSales(data);
        } catch (error) {
            console.error("Error fetching sales:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeSale = async (id: number): Promise<boolean> => {
        try {
            await deleteSale(id);
            setSales((prev) => prev.filter((s) => s.id !== id));
            return true;
        } catch (error) {
            console.error("Error deleting sale:", error);
            return false;
        }
    };

    return { sales, isLoading, fetchSales, removeSale };
};
