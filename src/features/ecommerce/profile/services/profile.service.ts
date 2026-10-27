import { api } from "@/api";

export interface UserProfile {
    id: number;
    correo: string;
    rol: string;
    foto?: string | null;
    cliente?: {
        id: number;
        nombre: string;
        apellido: string;
        correo: string;
        telefono?: string | null;
        documento?: string | null;
        foto?: string | null;
        tipoDocumento?: { id: number; nombre: string; abreviatura: string } | null;
    } | null;
}

export interface UpdateProfileDto {
    nombre?: string;
    apellido?: string;
    telefono?: string;
    documento?: string;
    foto?: string;
}

export const getProfile = async (): Promise<UserProfile> => {
    const { data } = await api.get("/auth/perfil");
    return data;
};

export const updateProfile = async (dto: UpdateProfileDto): Promise<UserProfile> => {
    const { data } = await api.patch("/auth/perfil", dto);
    return data;
};
