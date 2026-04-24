import { useState, useEffect } from "react";
import { getBrands, createBrand } from "../services/brands.service";

export interface BrandOption {
    value: string;
    label: string;
}

export const useBrands = () => {
    const [brands, setBrands] = useState<BrandOption[]>([]);
    const [isLoadingBrands, setIsLoadingBrands] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getBrands();
                setBrands(data.map(item => ({ value: String(item.id), label: item.nombre })));
            } catch {
                // silently fail
            } finally {
                setIsLoadingBrands(false);
            }
        };
        load();
    }, []);

    const addBrandToAPI = async (name: string): Promise<BrandOption | null> => {
        try {
            const created = await createBrand(name);
            const option = { value: String(created.id), label: created.nombre };
            setBrands(prev => [...prev, option]);
            return option;
        } catch {
            return null;
        }
    };

    return { brands, isLoadingBrands, addBrandToAPI };
};
