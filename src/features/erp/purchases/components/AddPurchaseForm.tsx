import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShoppingBag } from "lucide-react";
import type { CreatePurchaseDto, CreatePurchaseDetailDto, PurchaseTipo } from "../types/purchases.type";
import type { Supplier } from "@/features/erp/suppliers/types/suppliers.type";
import type { Item } from "@/features/erp/items/types/items.type";
import type { Product } from "@/features/erp/products/types/Products.type";
import { getSuppliers } from "@/features/erp/suppliers/services/suppliers.service";
import { getItems } from "@/features/erp/items/services/items.service";
import { getAllProducts } from "@/features/erp/products/services/products.service";
import { sileo } from "sileo";

interface Line {
    key: number;
    // ARTICULO
    articuloId: string;
    // PRODUCTO
    productoId: string;
    tallaId: string;
    colorId: string;
    // Ambos
    cantidad: string;
    precio: string;
}

const emptyLine = (key: number): Line => ({
    key, articuloId: "", productoId: "", tallaId: "", colorId: "", cantidad: "1", precio: "",
});

interface Props {
    onSuccess: (dto: CreatePurchaseDto) => Promise<void>;
    onCancel: () => void;
}

export const AddPurchaseForm = ({ onSuccess, onCancel }: Props) => {
    const [tipo, setTipo]               = useState<PurchaseTipo>("ARTICULO");
    const [proveedorId, setProveedorId] = useState("");
    const [lines, setLines]             = useState<Line[]>([emptyLine(0)]);
    const [nextKey, setNextKey]         = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [articulos, setArticulos] = useState<Item[]>([]);
    const [products, setProducts]   = useState<Product[]>([]);
    const [loading, setLoading]     = useState(true);

    useEffect(() => {
        Promise.all([getSuppliers(), getItems(), getAllProducts()])
            .then(([s, a, p]) => { setSuppliers(s); setArticulos(a); setProducts(p); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleTipoChange = (t: PurchaseTipo) => {
        setTipo(t);
        setLines([emptyLine(0)]);
        setNextKey(1);
    };

    const addLine = () => {
        setLines(prev => [...prev, emptyLine(nextKey)]);
        setNextKey(k => k + 1);
    };

    const removeLine = (key: number) => {
        if (lines.length === 1) return;
        setLines(prev => prev.filter(l => l.key !== key));
    };

    const updateLine = (key: number, field: keyof Line, value: string) => {
        setLines(prev => prev.map(l => {
            if (l.key !== key) return l;
            const updated = { ...l, [field]: value };
            // Auto-fill precio when articulo changes
            if (field === "articuloId" && value) {
                const art = articulos.find(a => String(a.id) === value);
                if (art && !l.precio) updated.precio = String(art.precio);
            }
            // Reset talla/color when product changes
            if (field === "productoId") {
                updated.tallaId = "";
                updated.colorId = "";
            }
            return updated;
        }));
    };

    const total = lines.reduce((sum, l) => {
        const c = parseFloat(l.cantidad) || 0;
        const p = parseFloat(l.precio)   || 0;
        return sum + c * p;
    }, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!proveedorId) {
            sileo.warning({ title: "Proveedor requerido", description: "Selecciona un proveedor." });
            return;
        }
        const invalidLines = lines.filter(l => {
            if (tipo === "ARTICULO" && !l.articuloId) return true;
            if (tipo === "PRODUCTO" && !l.productoId) return true;
            if (!l.cantidad || parseFloat(l.cantidad) <= 0) return true;
            if (!l.precio   || parseFloat(l.precio)   <= 0) return true;
            return false;
        });
        if (invalidLines.length > 0) {
            sileo.warning({ title: "Datos incompletos", description: "Completa todos los campos de cada línea." });
            return;
        }

        const detalles: CreatePurchaseDetailDto[] = lines.map(l => ({
            articuloId: tipo === "ARTICULO" ? Number(l.articuloId) : undefined,
            productoId: tipo === "PRODUCTO" ? Number(l.productoId) : undefined,
            tallaId:    tipo === "PRODUCTO" && l.tallaId   ? Number(l.tallaId)   : undefined,
            colorId:    tipo === "PRODUCTO" && l.colorId   ? Number(l.colorId)   : undefined,
            cantidad:   Math.round(parseFloat(l.cantidad)),
            precio:     parseFloat(l.precio),
        }));

        setIsSubmitting(true);
        try {
            await onSuccess({ tipo, proveedorId: Number(proveedorId), detalles });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="py-10 flex items-center justify-center gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Cargando datos...</span>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-5">

            {/* Tipo */}
            <div>
                <Label className="text-xs text-slate-600 mb-2 block">Tipo de Compra <span className="text-rose-500">*</span></Label>
                <div className="flex gap-2">
                    {(["ARTICULO", "PRODUCTO"] as PurchaseTipo[]).map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => handleTipoChange(t)}
                            className={`flex-1 py-2 px-4 rounded-lg border text-sm font-semibold transition-all ${
                                tipo === t
                                    ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-amber-400"
                            }`}
                        >
                            {t === "ARTICULO" ? "Insumo / Materia Prima" : "Producto Terminado"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Proveedor */}
            <div>
                <Label className="text-xs text-slate-600 mb-1.5 block">Proveedor <span className="text-rose-500">*</span></Label>
                <Select value={proveedorId} onValueChange={setProveedorId}>
                    <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                        {suppliers.map(s => (
                            <SelectItem key={s.id} value={String(s.id)}>
                                {s.nombre} — {s.documento}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Líneas de detalle */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-600">
                        {tipo === "ARTICULO" ? "Insumos a comprar" : "Productos a comprar"} <span className="text-rose-500">*</span>
                    </Label>
                    <button
                        type="button"
                        onClick={addLine}
                        className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Agregar línea
                    </button>
                </div>

                <div className="space-y-2">
                    {lines.map((line, idx) => (
                        <div key={line.key} className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-xs text-slate-400 font-medium mt-2.5 w-4 shrink-0">{idx + 1}</span>

                            {/* Selección principal */}
                            <div className="flex-1 min-w-0">
                                {tipo === "ARTICULO" ? (
                                    <Select value={line.articuloId} onValueChange={v => updateLine(line.key, "articuloId", v)}>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue placeholder="Seleccionar insumo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {articulos.map(a => (
                                                <SelectItem key={a.id} value={String(a.id)}>
                                                    {a.nombre} {a.unidad ? `(${a.unidad})` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Select value={line.productoId} onValueChange={v => updateLine(line.key, "productoId", v)}>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue placeholder="Seleccionar producto..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map(p => (
                                                <SelectItem key={p.id} value={String(p.id)}>
                                                    {p.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            {/* Talla y Color (solo PRODUCTO) */}
                            {tipo === "PRODUCTO" && line.productoId && (() => {
                                const prod = products.find(p => String(p.id) === line.productoId);
                                return (
                                    <>
                                        {(prod?.tallas?.length ?? 0) > 0 && (
                                            <Select value={line.tallaId} onValueChange={v => updateLine(line.key, "tallaId", v)}>
                                                <SelectTrigger className="h-9 text-sm w-24">
                                                    <SelectValue placeholder="Talla" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {prod!.tallas!.map(t => (
                                                        <SelectItem key={t.id} value={String(t.id)}>{t.nombre}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        {(prod?.colores?.length ?? 0) > 0 && (
                                            <Select value={line.colorId} onValueChange={v => updateLine(line.key, "colorId", v)}>
                                                <SelectTrigger className="h-9 text-sm w-24">
                                                    <SelectValue placeholder="Color" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {prod!.colores.map(c => (
                                                        <SelectItem key={c.id} value={String(c.id)}>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: c.nombre }} />
                                                                {c.nombre}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </>
                                );
                            })()}

                            {/* Cantidad */}
                            <Input
                                type="number" min={1} step={1}
                                placeholder="Cant."
                                value={line.cantidad}
                                onChange={e => updateLine(line.key, "cantidad", e.target.value)}
                                className="h-9 text-sm w-20 shrink-0"
                            />

                            {/* Precio */}
                            <div className="relative w-24 shrink-0">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">S/</span>
                                <Input
                                    type="number" min={0} step={0.01}
                                    placeholder="0.00"
                                    value={line.precio}
                                    onChange={e => updateLine(line.key, "precio", e.target.value)}
                                    className="h-9 text-sm pl-7"
                                />
                            </div>

                            {/* Subtotal */}
                            <div className="text-xs text-slate-500 font-mono mt-2.5 w-20 shrink-0 text-right">
                                {((parseFloat(line.cantidad) || 0) * (parseFloat(line.precio) || 0)).toFixed(2)}
                            </div>

                            {/* Remove */}
                            <button
                                type="button"
                                onClick={() => removeLine(line.key)}
                                disabled={lines.length === 1}
                                className="mt-1.5 w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-30 transition-colors shrink-0"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Total */}
            <div className="flex justify-end">
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center gap-3">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-slate-500">Total:</span>
                    <span className="font-bold text-amber-700 text-base">S/ {total.toFixed(2)}</span>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700">
                    {isSubmitting ? "Guardando..." : "Registrar Compra"}
                </Button>
            </div>
        </form>
    );
};
