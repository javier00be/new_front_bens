export type PurchaseTipo   = 'PRODUCTO' | 'ARTICULO';
export type PurchaseEstado = 'VIGENTE'  | 'ANULADO';

export interface PurchaseDetail {
    id: number;
    productoId?: number;
    producto?: { id: number; nombre: string };
    tallaId?: number;
    talla?: { id: number; nombre: string };
    colorId?: number;
    color?: { id: number; nombre: string };
    cantidad: number;
    precio: number;
    subtotal?: number;
}

export interface PurchaseDetailArticulo {
    id: number;
    articuloId?: number;
    articulo?: { id: number; nombre: string; unidad?: string };
    cantidad: number;
    precio: number;
    subtotal?: number;
}

export interface Purchase {
    id: number;
    tipo: PurchaseTipo;
    estado: PurchaseEstado;
    proveedorId: number;
    proveedor?: { id: number; nombre: string; documento: string };
    total: number;
    detalles: PurchaseDetail[];
    detallesArticulo: PurchaseDetailArticulo[];
    createdAt: string;
    updatedAt: string;
}

export interface CreatePurchaseDetailDto {
    productoId?: number;
    articuloId?: number;
    tallaId?: number;
    colorId?: number;
    cantidad: number;
    precio: number;
}

export interface CreatePurchaseDto {
    tipo: PurchaseTipo;
    proveedorId: number;
    detalles: CreatePurchaseDetailDto[];
}
