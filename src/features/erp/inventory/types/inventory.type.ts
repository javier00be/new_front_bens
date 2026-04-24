export interface InventoryItem {
    id: number;
    productoId: number;
    producto?: {
        id: number;
        nombre: string;
        sku?: string;
        precio: number;
        categoria?: { id: number; nombre: string };
        marca?: { id: number; nombre: string };
    };
    tallaId: number;
    talla?: { id: number; nombre: string };
    colorId: number;
    color?: { id: number; nombre: string };
    stock: number;
    stockMinimo: number;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateStockDto {
    stock: number;
}
