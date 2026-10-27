import { api } from "@/api";
import type { Product, CreateProductDto, PaginatedResponse } from "../types/Products.type";

export const getProducts = async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<Product>> => {
    const response = await api.get("/products", { params: { page, limit } });
    return response.data;
};

export const getAllProducts = async (): Promise<Product[]> => {
    const response = await api.get("/products", { params: { page: 1, limit: 500 } });
    return response.data?.data ?? response.data;
};

export const createProduct = async (dto: CreateProductDto): Promise<Product> => {
    const response = await api.post("/products", dto);
    return response.data;
};

export const updateProduct = async (id: number, dto: Partial<CreateProductDto>): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, dto);
    return response.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
};

export const getProductById = async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
};

export const getBestSellers = async (limit: number = 8): Promise<Product[]> => {
    const response = await api.get("/products/featured/best-sellers", { params: { limit } });
    return response.data;
};

export const getRelatedProducts = async (id: number, limit: number = 8): Promise<Product[]> => {
    const response = await api.get(`/products/${id}/related`, { params: { limit } });
    return response.data;
};

