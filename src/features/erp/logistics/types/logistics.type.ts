export type EstadoLogistica = "PAGADO" | "EN_CAMINO" | "ENTREGADO";

export interface LogisticOrder {
    id:              number;
    clienteId:       number;
    cliente?: {
        nombre:   string;
        apellido: string;
        correo?:  string;
        telefono?: string;
    };
    total:           number;
    estado:          EstadoLogistica;
    medioPago?: { nombre: string };
    direccionEnvio?: string | null;
    fechaEntrega?:   string | null;
    observaciones?:  string | null;
    detalles: {
        id:         number;
        cantidad:   number;
        producto?:  { nombre: string };
        talla?:     { nombre: string } | null;
        color?:     { nombre: string } | null;
    }[];
    createdAt: string;
    updatedAt: string;
}

export interface DeliverDto {
    direccionEnvio?: string;
    fechaEntrega?:   string;
    observaciones?:  string;
}
