export interface Item {
    id: number;
    nombre: string;
    descripcion?: string;
    cantidad: number;
    precio: number;
    unidad: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateItemDto {
    nombre: string;
    descripcion?: string;
    cantidad: number;
    precio: number;
    unidad: string;
}
