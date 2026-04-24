export type EstadoProduccion = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';

export interface OrdenProduccion {
    id: number;
    productoId: number;
    producto?: { id: number; nombre: string; sku?: string };
    tallaId?: number | null;
    talla?: { id: number; nombre: string };
    colorId?: number | null;
    color?: { id: number; nombre: string };
    cantidadPlanificada: number;
    cantidadProducida: number;
    estado: EstadoProduccion;
    usuarioId?: number | null;
    observaciones?: string | null;
    fechaInicio?: string | null;
    fechaFin?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateOrdenProduccionDto {
    productoId: number;
    tallaId?: number | null;
    colorId?: number | null;
    cantidadPlanificada: number;
    observaciones?: string;
}
