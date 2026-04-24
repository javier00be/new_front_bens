import { useState, useEffect } from "react";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../services/customers.service";
import type { Customer, CreateCustomerDto } from "../types/customers.type";

export const useCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const data = await getCustomers();
            setCustomers(data);
        } catch {
            // caller handles error display
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchCustomers(); }, []);

    const addCustomer = async (dto: CreateCustomerDto): Promise<Customer | null> => {
        try {
            const created = await createCustomer(dto);
            setCustomers(prev => [created, ...prev]);
            return created;
        } catch {
            return null;
        }
    };

    const editCustomer = async (id: number, dto: Partial<CreateCustomerDto>): Promise<Customer | null> => {
        try {
            const updated = await updateCustomer(id, dto);
            setCustomers(prev => prev.map(c => c.id === id ? updated : c));
            return updated;
        } catch {
            return null;
        }
    };

    const removeCustomer = async (id: number): Promise<boolean> => {
        try {
            await deleteCustomer(id);
            setCustomers(prev => prev.filter(c => c.id !== id));
            return true;
        } catch {
            return false;
        }
    };

    return { customers, isLoading, fetchCustomers, addCustomer, editCustomer, removeCustomer };
};
