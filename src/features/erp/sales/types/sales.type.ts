export interface SaleDetail {
    id:             number;
    productoId:     number;
    producto?:      { id: number; nombre: string };
    tallaId?:       number | null;
    talla?:         { nombre: string } | null;
    colorId?:       number | null;
    color?:         { nombre: string } | null;
    cantidad:       number;
    precioUnitario: number;
    descuento:      number;
    subtotal:       number;
}

export interface Sale {
    id:       number;
    pedidoId: number;
    pedido: {
        id:         number;
        total:      number;
        createdAt:  string;
        cliente?:   { nombre: string; apellido: string };
        medioPago?: { nombre: string };
        detalles:   SaleDetail[];
    };
    createdAt: string;
    updatedAt: string;
}
