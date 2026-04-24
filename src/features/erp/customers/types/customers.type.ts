export interface Customer {
    id: number;
    tipoDocumentoId?: number | null;
    tipoDocumento?: { id: number; nombre: string; abreviatura: string } | null;
    documento: string;
    nombre: string;
    apellido: string;
    correo: string;
    telefono?: string | null;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateCustomerDto {
    tipoDocumentoId?: number;
    documento: string;
    nombre: string;
    apellido: string;
    correo: string;
    telefono?: string;
}
