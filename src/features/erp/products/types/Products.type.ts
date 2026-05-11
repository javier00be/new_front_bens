export interface PaginationMeta {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

export type TipoDescuento = 'PORCENTAJE' | 'VALOR_FIJO' | 'SIN_DESCUENTO';

export interface ProductColor {
    id: number;
    nombre: string;
}

export interface ProductInventario {
    id: number;
    tallaId: number;
    colorId: number;
    stock: number;
    precio: number;
    talla: { id: number; nombre: string };
    color: { id: number; nombre: string };
}

export interface Product {
    id: number;
    nombre: string;
    precio: number;
    colores: ProductColor[];
    tallas?: { id: number; nombre: string }[];
    inventarios?: ProductInventario[];
    imagenes?: string[];
    sku?: string;
    descripcion?: string;
    tipoDescuento: TipoDescuento;
    valorDescuento: number;
    categoria?: { id: number; nombre: string };
    marca?: { id: number; nombre: string };
    createdAt?: string;
    updatedAt?: string;
    estado?: string;
}

export interface CreateProductDto {
    nombre:         string;
    precio:         number;
    categoriaId:    number;
    marcaId:        number;
    color?:         string[];
    tallas?:        string[];
    imagenes?:      string[];
    sku?:           string;
    descripcion?:   string;
    estado?:        string;
    tipoDescuento:  TipoDescuento;
    valorDescuento: number;
}