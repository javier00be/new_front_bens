export const EstadoPedido = {
    PENDIENTE:  "PENDIENTE",
    PROCESANDO: "PROCESANDO",
    PAGADO:     "PAGADO",
    EN_CAMINO:  "EN_CAMINO",
    ENTREGADO:  "ENTREGADO",
    CANCELADO:  "CANCELADO",
} as const;
export type EstadoPedido = typeof EstadoPedido[keyof typeof EstadoPedido];

export interface MedioPago {
    id:        number;
    nombre:    string;
    createdAt: string;
    updatedAt: string;
}

export interface TipoDocumento {
    id:          number;
    nombre:      string;
    abreviatura: string;
    createdAt:   string;
    updatedAt:   string;
}

export interface TipoComprobante {
    id:          number;
    nombre:      string;
    abreviatura: string;
    createdAt:   string;
    updatedAt:   string;
}

export interface OrderDetail {
    id?:             number;
    pedidoId?:       number;
    productoId:      number;
    producto?:       { id: number; nombre: string };
    tallaId?:        number | null;
    talla?:          { nombre: string } | null;
    colorId?:        number | null;
    color?:          { nombre: string } | null;
    productoNombre?: string;
    tallaNombre?:    string;
    colorNombre?:    string;
    cantidad:        number;
    precioUnitario:  number;
    descuento:       number;
    subtotal:        number;
}

export interface Order {
    id:              number;
    clienteId:       number;
    cliente?: {
        nombre:   string;
        apellido: string;
        correo?:  string;
    };
    usuarioId?:       number | null;
    cuponId?:         number | null;
    cupon?: { codigo: string };
    subtotal:         number;
    impuesto:         number;
    descuento:        number;
    descuentoCupon:   number;
    total:            number;
    estado:           EstadoPedido;
    estadoPago:       string;
    medioPagoId?:     number | null;
    medioPago?:       MedioPago;
    tipoComprobanteId?: number | null;
    tipoComprobante?:   TipoComprobante;
    direccionEnvio?:  string | null;
    fechaEntrega?:    string | null;
    observaciones?:   string | null;
    origen:           "ERP" | "ECOMMERCE";
    detalles:         OrderDetail[];
    createdAt:        string;
    updatedAt:        string;
}

export interface CreateOrderDetailDto {
    productoId:      number;
    tallaId?:        number;
    colorId?:        number;
    cantidad:        number;
    precioUnitario?: number;
    omitirDescuento?: boolean;
}

export interface CreateOrderDto {
    clienteId:        number;
    usuarioId?:       number;
    cuponCodigo?:     string;
    medioPagoId?:     number;
    tipoComprobanteId?: number;
    direccionEnvio?:  string;
    fechaEntrega?:    string;
    observaciones?:   string;
    origen?:          "ERP" | "ECOMMERCE";
    detalles:         CreateOrderDetailDto[];
}
