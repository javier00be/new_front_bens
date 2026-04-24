export type UserRol = 'ADMINISTRADOR' | 'VENDEDOR' | 'CLIENTE';

export interface User {
    id: number;
    correo: string;
    rol: UserRol;
    createdAt: string;
}

export interface CreateUserDto {
    correo: string;
    password: string;
}

export interface UpdateUserDto {
    correo?: string;
    rol?: UserRol;
}
