export interface Supplier {
  id?: number;
  documento: string;
  nombre: string;
  descripcion?: string | null;
  correo: string;
  telefono?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateSupplierDto {
  documento: string;
  nombre: string;
  descripcion?: string | null;
  correo: string;
  telefono?: string | null;
}


