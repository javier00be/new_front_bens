import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CreateOrdenProduccionDto } from "../types/production.type";
import type { Product } from "@/features/erp/products/types/Products.type";
import type { SizeResponse } from "@/features/erp/products/types/size.type";
import { getAllProducts } from "@/features/erp/products/services/products.service";
import { getSizes } from "@/features/erp/products/services/size.service";

interface Props {
    onSuccess: (dto: CreateOrdenProduccionDto) => Promise<void>;
    onCancel: () => void;
}

export const AddProductionOrderForm = ({ onSuccess, onCancel }: Props) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [tallas, setTallas] = useState<SizeResponse[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    const [productoId, setProductoId] = useState<number | null>(null);
    const [tallaId, setTallaId] = useState<number | null>(null);
    const [colorId, setColorId] = useState<number | null>(null);
    const [cantidadPlanificada, setCantidadPlanificada] = useState(1);
    const [observaciones, setObservaciones] = useState("");

    useEffect(() => {
        Promise.all([getAllProducts(), getSizes()])
            .then(([p, t]) => { setProducts(p); setTallas(t); })
            .catch(console.error)
            .finally(() => setLoadingData(false));
    }, []);

    const selectedProduct = products.find(p => p.id === productoId);
    const productColors = selectedProduct?.colores ?? [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productoId || cantidadPlanificada < 1) return;
        setIsSubmitting(true);
        try {
            await onSuccess({
                productoId,
                tallaId: tallaId || null,
                colorId: colorId || null,
                cantidadPlanificada,
                observaciones: observaciones || undefined,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingData) return (
        <div className="py-12 flex items-center justify-center gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Cargando datos...</span>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label className="text-xs text-slate-600 mb-1.5 block">Producto a Fabricar <span className="text-rose-500">*</span></Label>
                <Select onValueChange={(v) => { setProductoId(Number(v)); setTallaId(null); setColorId(null); }}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                    <SelectContent>
                        {products.map(p => (
                            <SelectItem key={p.id} value={String(p.id)}>
                                {p.nombre} {p.sku ? `(${p.sku})` : ""}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <Label className="text-xs text-slate-600 mb-1.5 block">Talla (Opcional)</Label>
                    <Select onValueChange={(v) => setTallaId(v && v !== "none" ? Number(v) : null)}>
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin talla</SelectItem>
                            {tallas.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.nombre}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs text-slate-600 mb-1.5 block">Color (Opcional)</Label>
                    <Select
                        onValueChange={(v) => setColorId(v && v !== "none" ? Number(v) : null)}
                        disabled={productColors.length === 0}
                    >
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin color</SelectItem>
                            {productColors.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs text-slate-600 mb-1.5 block">Cantidad <span className="text-rose-500">*</span></Label>
                    <Input
                        type="number"
                        min={1}
                        value={cantidadPlanificada}
                        onChange={e => setCantidadPlanificada(Number(e.target.value))}
                    />
                </div>
            </div>

            <div>
                <Label className="text-xs text-slate-600 mb-1.5 block">Observaciones</Label>
                <Textarea
                    placeholder="Notas sobre la fabricación..."
                    rows={2}
                    className="resize-none text-sm"
                    value={observaciones}
                    onChange={e => setObservaciones(e.target.value)}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
                <Button
                    type="submit"
                    disabled={isSubmitting || !productoId}
                    className="bg-green-600 hover:bg-green-700"
                >
                    {isSubmitting ? "Guardando..." : "Crear Orden"}
                </Button>
            </div>
        </form>
    );
};
