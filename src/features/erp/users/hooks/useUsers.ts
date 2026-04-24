import { useState, useEffect } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../services/users.service";
import type { User, CreateUserDto, UpdateUserDto } from "../types/users.type";

export const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch {
            // caller handles error display
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const addUser = async (dto: CreateUserDto): Promise<User | null> => {
        try {
            const created = await createUser(dto);
            setUsers(prev => [created, ...prev]);
            return created;
        } catch {
            return null;
        }
    };

    const editUser = async (id: number, dto: UpdateUserDto): Promise<User | null> => {
        try {
            const updated = await updateUser(id, dto);
            setUsers(prev => prev.map(u => u.id === id ? updated : u));
            return updated;
        } catch {
            return null;
        }
    };

    const removeUser = async (id: number): Promise<boolean> => {
        try {
            await deleteUser(id);
            setUsers(prev => prev.filter(u => u.id !== id));
            return true;
        } catch {
            return false;
        }
    };

    return { users, isLoading, fetchUsers, addUser, editUser, removeUser };
};
