import { api } from "@/api";
import type { User, CreateUserDto, UpdateUserDto } from "../types/users.type";

export const getUsers = async (): Promise<User[]> => {
    const response = await api.get("/users");
    return response.data;
};

export const createUser = async (dto: CreateUserDto): Promise<User> => {
    const response = await api.post("/users", dto);
    return response.data;
};

export const updateUser = async (id: number, dto: UpdateUserDto): Promise<User> => {
    const response = await api.patch(`/users/${id}`, dto);
    return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
};
