export interface RecipeItem {
    id: number;
    productoId: number;
    articuloId: number;
    articulo?: { id: number; nombre: string; unidad: string };
    cantidad: number;
    createdAt: string;
    updatedAt: string;
}

export interface Recipe {
    productoId: number;
    producto?: { id: number; nombre: string; sku?: string };
    items: RecipeItem[];
}

export interface CreateRecipeItemDto {
    productoId: number;
    articuloId: number;
    cantidad: number;
}
