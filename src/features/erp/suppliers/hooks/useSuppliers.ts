import { useState, useEffect } from "react";
import type { Supplier, CreateSupplierDto } from "../types/suppliers.type";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "../services/suppliers.service";

export const useSuppliers = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSuppliers = async () => {
        setIsLoading(true);
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch {
            // caller handles error display
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    const addSupplier = async (dto: CreateSupplierDto): Promise<Supplier | null> => {
        try {
            const created = await createSupplier(dto);
            setSuppliers(prev => [created, ...prev]);
            return created;
        } catch {
            return null;
        }
    };

    const editSupplier = async (id: number, dto: Partial<CreateSupplierDto>): Promise<Supplier | null> => {
        try {
            const updated = await updateSupplier(id, dto);
            setSuppliers(prev => prev.map(s => s.id === id ? updated : s));
            return updated;
        } catch {
            return null;
        }
    };

    const removeSupplier = async (id: number): Promise<boolean> => {
        try {
            await deleteSupplier(id);
            setSuppliers(prev => prev.filter(s => s.id !== id));
            return true;
        } catch {
            return false;
        }
    };

    return { suppliers, isLoading, fetchSuppliers, addSupplier, editSupplier, removeSupplier };
};
