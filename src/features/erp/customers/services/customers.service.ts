import { api } from "@/api";
import type { Customer, CreateCustomerDto } from "../types/customers.type";

export const getCustomers = async (): Promise<Customer[]> => {
    const response = await api.get("/clients");
    return response.data;
};

export const createCustomer = async (dto: CreateCustomerDto): Promise<Customer> => {
    const response = await api.post("/clients", dto);
    return response.data;
};

export const updateCustomer = async (id: number, dto: Partial<CreateCustomerDto>): Promise<Customer> => {
    const response = await api.patch(`/clients/${id}`, dto);
    return response.data;
};

export const deleteCustomer = async (id: number): Promise<void> => {
    await api.delete(`/clients/${id}`);
};
