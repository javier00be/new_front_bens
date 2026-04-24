import { useState, useEffect } from "react";
import { getAllProducts, createProduct, updateProduct, deleteProduct } from "../services/products.service";
import type { Product, CreateProductDto } from "../types/Products.type";

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isSavingProduct, setIsSavingProduct] = useState(false);

    const fetchProducts = async () => {
        setIsLoadingProducts(true);
        try {
            const data = await getAllProducts();
            setProducts(data);
        } catch {
            // caller handles error display
        } finally {
            setIsLoadingProducts(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const addProductToAPI = async (dto: CreateProductDto): Promise<Product | null> => {
        setIsSavingProduct(true);
        try {
            const created = await createProduct(dto);
            setProducts(prev => [created, ...prev]);
            return created;
        } catch {
            return null;
        } finally {
            setIsSavingProduct(false);
        }
    };

    const editProductInAPI = async (id: number, dto: Partial<CreateProductDto>): Promise<Product | null> => {
        setIsSavingProduct(true);
        try {
            const updated = await updateProduct(id, dto);
            setProducts(prev => prev.map(p => p.id === id ? updated : p));
            return updated;
        } catch {
            return null;
        } finally {
            setIsSavingProduct(false);
        }
    };

    const removeProductFromAPI = async (id: number): Promise<boolean> => {
        try {
            await deleteProduct(id);
            setProducts(prev => prev.filter(p => p.id !== id));
            return true;
        } catch {
            return false;
        }
    };

    return {
        products,
        isLoadingProducts,
        isSavingProduct,
        fetchProducts,
        addProductToAPI,
        editProductInAPI,
        removeProductFromAPI,
    };
};
