import { useState, useEffect } from "react";
import { getAllProducts, createProduct, updateProduct, deleteProduct } from "../services/products.service";
import type { Product, CreateProductDto } from "../types/Products.type";

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isSavingProduct, setIsSavingProduct] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = async () => {
        setIsLoadingProducts(true);
        setError(null);
        try {
            const data = await getAllProducts();
            setProducts(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error al cargar productos";
            setError(message);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const addProductToAPI = async (dto: CreateProductDto): Promise<Product> => {
        setIsSavingProduct(true);
        try {
            const created = await createProduct(dto);
            setProducts(prev => [created, ...prev]);
            return created;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error al crear producto";
            throw new Error(message);
        } finally {
            setIsSavingProduct(false);
        }
    };

    const editProductInAPI = async (id: number, dto: Partial<CreateProductDto>): Promise<Product> => {
        setIsSavingProduct(true);
        try {
            const updated = await updateProduct(id, dto);
            setProducts(prev => prev.map(p => p.id === id ? updated : p));
            return updated;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error al actualizar producto";
            throw new Error(message);
        } finally {
            setIsSavingProduct(false);
        }
    };

    const removeProductFromAPI = async (id: number): Promise<void> => {
        try {
            await deleteProduct(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error al eliminar producto";
            throw new Error(message);
        }
    };

    return {
        products,
        isLoadingProducts,
        isSavingProduct,
        error,
        fetchProducts,
        addProductToAPI,
        editProductInAPI,
        removeProductFromAPI,
    };
};
