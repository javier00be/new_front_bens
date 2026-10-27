import { api } from "@/api";

export interface ReviewItem {
    id: number;
    productoId: number;
    clienteId: number;
    calificacion: number;
    comentario: string;
    cliente?: {
        id: number;
        nombre: string;
        apellido: string;
    };
    createdAt: string;
}

export interface ReviewStats {
    reviews: ReviewItem[];
    average: number;
    total: number;
}

export const getReviewsByProduct = async (productId: number): Promise<ReviewStats> => {
    const response = await api.get<ReviewStats>(`/reviews/product/${productId}`);
    return response.data;
};

export const createProductReview = async (dto: {
    productoId: number;
    calificacion: number;
    comentario: string;
}): Promise<ReviewItem> => {
    const response = await api.post<ReviewItem>("/reviews", dto);
    return response.data;
};
