import { api } from "@/api";
import type { Product } from "@/features/erp/products/types/Products.type";

export interface FavoriteItem {
    id: number;
    clienteId: number;
    productoId: number;
    producto: Product;
    createdAt: string;
}

export const getMyFavorites = async (): Promise<FavoriteItem[]> => {
    const response = await api.get<FavoriteItem[]>("/favorites");
    return response.data;
};

export const toggleFavoriteApi = async (productId: number): Promise<{ isFavorite: boolean }> => {
    const response = await api.post<{ isFavorite: boolean }>(`/favorites/${productId}/toggle`);
    return response.data;
};

export const checkIsFavoriteApi = async (productId: number): Promise<{ isFavorite: boolean }> => {
    const response = await api.get<{ isFavorite: boolean }>(`/favorites/check/${productId}`);
    return response.data;
};

export const removeFavoriteApi = async (productId: number): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(`/favorites/${productId}`);
    return response.data;
};
