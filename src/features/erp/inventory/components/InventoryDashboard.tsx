import { useEffect, useState, useMemo, Fragment } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GenericModal, ConfirmModal } from "@/components/shared/GenericModal";
import { GenericPagination } from "@/components/shared/GenericPagination";
import { Link } from "react-router-dom";
import {
    Search, Plus, PackageOpen, Edit2, Layers,
    AlertTriangle, X, Check, Minus, TrendingDown,
    Package2, Pencil, PowerOff, ChevronRight, Tag,
} from "lucide-react";
import { getAllProducts, updateProduct } from "@/features/erp/products/services/products.service";
import { getInventoryByProduct, updateStock } from "../services/inventory.service";
import type { Product } from "@/features/erp/products/types/Products.type";
import type { InventoryItem } from "../types/inventory.type";
import { sileo } from "sileo";

const ITEMS_PER_PAGE = 10;

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const StockBadge = ({ stock }: { stock: number }) => {
    if (stock === 0)
        return (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />Agotado
            </span>
        );
    if (stock < 10)
        return (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Bajo
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Disponible
        </span>
    );
};

const ColorDot = ({ nombre }: { nombre?: string }) => {
    if (!nombre) return <span className="text-slate-300 text-xs">—</span>;
    const trimmed = nombre.trim();
    return (
        <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border border-slate-200 shadow-sm shrink-0" style={{ backgroundColor: trimmed }} />
            <span className="text-xs font-medium text-slate-600">{trimmed.toUpperCase()}</span>
        </div>
    );
};

const SkeletonRow = () => (
    <tr className="border-b border-slate-100">
        {[160, 90, 60, 70, 80, 30].map((w, i) => (
            <td key={i} className="px-5 py-4">
                <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: w }} />
            </td>
        ))}
    </tr>
);

// ─── Modal de variantes ───────────────────────────────────────────────────────
interface VariantsModalProps {
    product: Product | null;
    variants: InventoryItem[];
    isLoading: boolean;
    onClose: () => void;
    // Stock por color/variante
    editingId: number | null;
    editingStock: string;
    onStartEditStock: (id: number, stock: number) => void;
    onCancelEditStock: () => void;
    onStockChange: (v: string) => void;
    onSaveStock: (id: number) => void;
    // Precio por talla (aplica a todos los colores de esa talla)
    editingTallaId: number | null;
    editingTallaPrecio: string;
    onStartEditPrecio: (tallaId: number, precio: number) => void;
    onCancelEditPrecio: () => void;
    onTallaPrecioChange: (v: string) => void;
    onSavePrecio: (tallaId: number) => void;
}

const VariantsModal = ({
    product, variants, isLoading, onClose,
    editingId, editingStock, onStartEditStock, onCancelEditStock, onStockChange, onSaveStock,
    editingTallaId, editingTallaPrecio, onStartEditPrecio, onCancelEditPrecio, onTallaPrecioChange, onSavePrecio,
}: VariantsModalProps) => {
    const totalStock = variants.reduce((acc, v) => acc + v.stock, 0);

    const grouped = useMemo(() => {
        const map = new Map<number, InventoryItem[]>();
        for (const item of variants) {
            if (!map.has(item.tallaId)) map.set(item.tallaId, []);
            map.get(item.tallaId)!.push(item);
        }
        return Array.from(map.values()).map(items => ({
            tallaId: items[0].tallaId,
            tallaNombre: items[0].talla?.nombre ?? "—",
            precio: Number(items[0].precio),
            items,
        }));
    }, [variants]);

    if (!product) return null;

    return (
        <GenericModal
            isOpen={!!product}
            onOpenChange={open => { if (!open) onClose(); }}
            title={product.nombre}
            description={`Stock por variante — ${variants.length} combinación${variants.length !== 1 ? "es" : ""} de talla y color`}
            icon={<Tag className="w-4 h-4" />}
            size="lg"
            scrollable
            maxBodyHeight="55vh"
            footer={
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        {product.sku && (
                            <span className="font-mono text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                                SKU: {product.sku}
                            </span>
                        )}
                        {product.categoria && (
                            <span className="text-xs text-slate-400">{product.categoria.nombre}</span>
                        )}
                        {variants.length > 0 && (
                            <span className="text-xs text-slate-500">
                                Stock total: <span className="font-bold text-slate-700">{totalStock} und.</span>
                            </span>
                        )}
                    </div>
                    <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
                </div>
            }
        >
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-3" />
                    <p className="text-sm text-slate-400">Cargando variantes...</p>
                </div>
            ) : variants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <PackageOpen className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium text-slate-500">Sin variantes registradas</p>
                    <p className="text-xs text-slate-400 mt-1">Este producto aún no tiene stock asignado</p>
                </div>
            ) : (
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="pb-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Color</th>
                            <th className="pb-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock</th>
                            <th className="pb-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                            <th className="pb-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {grouped.map(group => (
                            <Fragment key={group.tallaId}>
                                {/* Fila de cabecera de talla con precio editable */}
                                <tr className="border-t border-slate-200 bg-slate-50/80">
                                    <td colSpan={4} className="px-2 py-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                                                {group.tallaNombre}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {editingTallaId === group.tallaId ? (
                                                    <>
                                                        <span className="text-xs text-slate-400">S/</span>
                                                        <Input
                                                            type="number" min={0} step={0.01}
                                                            className="h-6 w-20 text-xs text-right rounded-lg border-indigo-300"
                                                            value={editingTallaPrecio}
                                                            onChange={e => onTallaPrecioChange(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === "Enter") onSavePrecio(group.tallaId);
                                                                if (e.key === "Escape") onCancelEditPrecio();
                                                            }}
                                                            autoFocus
                                                        />
                                                        <button onClick={() => onSavePrecio(group.tallaId)} title="Guardar precio"
                                                            className="w-6 h-6 rounded-md bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white transition-colors">
                                                            <Check className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={onCancelEditPrecio} title="Cancelar"
                                                            className="w-6 h-6 rounded-md bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-xs font-bold tabular-nums text-slate-700">
                                                            S/ {group.precio.toFixed(2)}
                                                        </span>
                                                        <button
                                                            onClick={() => onStartEditPrecio(group.tallaId, group.precio)}
                                                            title="Editar precio de talla"
                                                            className="w-6 h-6 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors"
                                                        >
                                                            <Edit2 className="w-3 h-3" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                {/* Filas de color con stock editable */}
                                {group.items.map(item => (
                                    <tr
                                        key={item.id}
                                        className={`transition-colors ${editingId === item.id ? "bg-indigo-50/60" : "hover:bg-slate-50/50"}`}
                                    >
                                        <td className="py-3 pl-4 pr-4">
                                            <ColorDot nombre={item.color?.nombre} />
                                        </td>
                                        <td className="py-3 pr-4">
                                            {editingId === item.id ? (
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
                                                        onClick={() => onStockChange(String(Math.max(0, parseInt(editingStock || "0") - 1)))}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <Input
                                                        type="number" min={0}
                                                        className="h-7 w-16 text-xs text-center rounded-lg border-indigo-300"
                                                        value={editingStock}
                                                        onChange={e => onStockChange(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === "Enter") onSaveStock(item.id);
                                                            if (e.key === "Escape") onCancelEditStock();
                                                        }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
                                                        onClick={() => onStockChange(String(parseInt(editingStock || "0") + 1))}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className={`text-sm font-bold tabular-nums ${
                                                    item.stock === 0 ? "text-rose-600" :
                                                    item.stock < 10  ? "text-amber-600" : "text-slate-800"
                                                }`}>
                                                    {item.stock}
                                                    <span className="text-xs font-normal text-slate-400 ml-1">und.</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 pr-4">
                                            <StockBadge stock={item.stock} />
                                        </td>
                                        <td className="py-3">
                                            {editingId === item.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => onSaveStock(item.id)} title="Guardar"
                                                        className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white transition-colors">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={onCancelEditStock} title="Cancelar"
                                                        className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => onStartEditStock(item.id, item.stock)} title="Editar stock"
                                                    className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            )}
        </GenericModal>
    );
};

// ─── Dashboard principal ──────────────────────────────────────────────────────
export const InventoryDashboard = () => {
    // Productos (lista principal)
    const [products, setProducts]               = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    // Variantes del producto seleccionado (modal)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [variants, setVariants]               = useState<InventoryItem[]>([]);
    const [isLoadingVariants, setIsLoadingVariants] = useState(false);

    // Paginación y búsqueda (sobre productos)
    const [search, setSearch]           = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Edición inline de stock por color y precio por talla (dentro del modal)
    const [editingId, setEditingId]                   = useState<number | null>(null);
    const [editingStock, setEditingStock]             = useState("");
    const [editingTallaId, setEditingTallaId]         = useState<number | null>(null);
    const [editingTallaPrecio, setEditingTallaPrecio] = useState("");

    // Confirmación de inactivar producto
    const [confirmInactivate, setConfirmInactivate] = useState<Product | null>(null);
    const [isInactivating, setIsInactivating]       = useState(false);

    // ── Carga inicial de productos ──────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setIsLoadingProducts(true);
            try {
                const data = await getAllProducts();
                setProducts(data);
            } catch {
                sileo.error({ title: "Error", description: "No se pudieron cargar los productos." });
            } finally {
                setIsLoadingProducts(false);
            }
        };
        load();
    }, []);

    // ── Al seleccionar un producto, cargar sus variantes de inventario ──────
    const handleRowClick = async (product: Product) => {
        setSelectedProduct(product);
        setVariants([]);
        setEditingId(null);
        setEditingTallaId(null);
        setIsLoadingVariants(true);
        try {
            const data = await getInventoryByProduct(product.id);
            setVariants(data);
        } catch {
            sileo.error({ title: "Error", description: "No se pudo cargar el inventario de este producto." });
        } finally {
            setIsLoadingVariants(false);
        }
    };

    const handleCloseModal = () => {
        setSelectedProduct(null);
        setVariants([]);
        setEditingId(null);
        setEditingTallaId(null);
    };

    // ── Ajustar stock por color/variante ───────────────────────────────────
    const handleSaveStock = async (id: number) => {
        const newStock = parseInt(editingStock, 10);
        if (isNaN(newStock) || newStock < 0) {
            sileo.warning({ title: "Valor inválido", description: "El stock debe ser un número mayor o igual a 0." });
            return;
        }
        try {
            await updateStock(id, { stock: newStock });
            setVariants(prev => prev.map(v => v.id === id ? { ...v, stock: newStock } : v));
            sileo.success({ title: "Stock actualizado", description: `Ajustado a ${newStock} unidades.` });
            setEditingId(null);
        } catch {
            sileo.error({ title: "Error", description: "No se pudo actualizar el stock." });
        }
    };

    // ── Ajustar precio por talla (aplica a todos los colores de esa talla) ─
    const handleSavePrecio = async (tallaId: number) => {
        const newPrecio = parseFloat(editingTallaPrecio);
        if (isNaN(newPrecio) || newPrecio < 0) {
            sileo.warning({ title: "Valor inválido", description: "El precio debe ser un número mayor o igual a 0." });
            return;
        }
        const tallaVariants = variants.filter(v => v.tallaId === tallaId);
        try {
            await Promise.all(tallaVariants.map(v => updateStock(v.id, { stock: v.stock, precio: newPrecio })));
            setVariants(prev => prev.map(v => v.tallaId === tallaId ? { ...v, precio: newPrecio } : v));
            sileo.success({ title: "Precio actualizado", description: `S/ ${newPrecio.toFixed(2)} aplicado a la talla.` });
            setEditingTallaId(null);
        } catch {
            sileo.error({ title: "Error", description: "No se pudo actualizar el precio." });
        }
    };

    // ── Inactivar producto ─────────────────────────────────────────────────
    const handleInactivate = async () => {
        if (!confirmInactivate) return;
        setIsInactivating(true);
        try {
            await updateProduct(confirmInactivate.id, { estado: "INACTIVO" });
            setProducts(prev => prev.map(p =>
                p.id === confirmInactivate.id ? { ...p, estado: "INACTIVO" } : p
            ));
            sileo.success({ title: "Producto inactivado", description: `"${confirmInactivate.nombre}" fue marcado como inactivo.` });
            setConfirmInactivate(null);
        } catch {
            sileo.error({ title: "Error", description: "No se pudo inactivar el producto." });
        } finally {
            setIsInactivating(false);
        }
    };

    // ── Filtrado y paginación de productos (client-side) ────────────────────
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return products.filter(p => {
            const matchSearch =
                p.nombre.toLowerCase().includes(q) ||
                p.sku?.toLowerCase().includes(q) ||
                p.categoria?.nombre.toLowerCase().includes(q);
            return matchSearch;
        });
    }, [products, search]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleSearch = (v: string) => { setSearch(v); setCurrentPage(1); };

    // ── Stats derivadas de productos ────────────────────────────────────────
    const totalProductos = products.length;
    const conTallas      = products.filter(p => (p.tallas?.length ?? 0) > 0).length;
    const conColores     = products.filter(p => (p.colores?.length ?? 0) > 0).length;
    const sinVariantes   = products.filter(p => (p.tallas?.length ?? 0) === 0 && (p.colores?.length ?? 0) === 0).length;

    return (
        <div className="space-y-6 pb-8">

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 px-8 py-7 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.3),transparent_60%)]" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500/40 to-transparent" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">Módulo ERP</p>
                        <h1 className="text-2xl font-bold text-white">Inventario</h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Selecciona un producto para ver y gestionar su stock por talla y color
                        </p>
                    </div>
                    <Button asChild className="bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-lg backdrop-blur-sm transition-all">
                        <Link to="/admin/products">
                            <Plus className="w-4 h-4 mr-2" /> Agregar Producto
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                        <div className="flex items-stretch">
                            <div className="w-1.5 bg-linear-to-b from-indigo-500 to-violet-600 rounded-l-xl shrink-0" />
                            <div className="flex-1 px-5 py-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total productos</p>
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                        <Layers className="w-4 h-4 text-indigo-700" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-indigo-700 tabular-nums">{totalProductos}</p>
                                <p className="text-xs text-slate-400 mt-1">en catálogo</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                        <div className="flex items-stretch">
                            <div className="w-1.5 bg-linear-to-b from-emerald-500 to-teal-600 rounded-l-xl shrink-0" />
                            <div className="flex-1 px-5 py-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Con tallas</p>
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                        <Package2 className="w-4 h-4 text-emerald-700" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-emerald-700 tabular-nums">{conTallas}</p>
                                <p className="text-xs text-slate-400 mt-1">tienen tallas asignadas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                        <div className="flex items-stretch">
                            <div className="w-1.5 bg-linear-to-b from-amber-500 to-orange-500 rounded-l-xl shrink-0" />
                            <div className="flex-1 px-5 py-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Con colores</p>
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                        <TrendingDown className="w-4 h-4 text-amber-700" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-amber-700 tabular-nums">{conColores}</p>
                                <p className="text-xs text-slate-400 mt-1">tienen colores asignados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                        <div className="flex items-stretch">
                            <div className="w-1.5 bg-linear-to-b from-rose-500 to-pink-600 rounded-l-xl shrink-0" />
                            <div className="flex-1 px-5 py-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sin variantes</p>
                                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                                        <AlertTriangle className="w-4 h-4 text-rose-700" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-rose-700 tabular-nums">{sinVariantes}</p>
                                <p className="text-xs text-slate-400 mt-1">sin talla ni color</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabla de productos */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-slate-100 bg-white">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por nombre, SKU o categoría..."
                                className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 rounded-xl focus:bg-white"
                                value={search}
                                onChange={e => handleSearch(e.target.value)}
                            />
                            {search && (
                                <button onClick={() => handleSearch("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 shrink-0">
                            {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {isLoadingProducts ? (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80">
                                    {["Producto", "Categoría", "Precio", "Tallas", "Colores", "Estado", ""].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
                            </tbody>
                        </table>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                <PackageOpen className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">
                                {search ? "Sin resultados" : "Sin productos registrados"}
                            </p>
                            <p className="text-xs text-slate-400 mb-5">
                                {search ? `No se encontraron productos para "${search}"` : "Agrega productos para gestionar el inventario"}
                            </p>
                            {!search ? (
                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl" asChild>
                                    <Link to="/admin/products"><Plus className="w-3.5 h-3.5 mr-1.5" />Ir a Productos</Link>
                                </Button>
                            ) : (
                                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleSearch("")}>
                                    Limpiar búsqueda
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/80">
                                            <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Producto</th>
                                            <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categoría</th>
                                            <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Precio</th>
                                            <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tallas</th>
                                            <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Colores</th>
                                            <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                                            <th className="px-3 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paginated.map(product => (
                                            <tr
                                                key={product.id}
                                                className="group hover:bg-slate-50/80 transition-colors"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                                                            {product.nombre}
                                                        </span>
                                                        {product.sku && (
                                                            <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                                                                {product.sku}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-xs text-slate-500">{product.categoria?.nombre ?? "—"}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="font-mono text-sm font-bold text-slate-700">
                                                        S/ {Number(product.precio).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {(product.tallas?.length ?? 0) > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {product.tallas!.slice(0, 4).map(t => (
                                                                <span key={t.id} className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                                                                    {t.nombre}
                                                                </span>
                                                            ))}
                                                            {product.tallas!.length > 4 && (
                                                                <span className="text-[10px] text-slate-400 px-1 py-0.5">
                                                                    +{product.tallas!.length - 4}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {(product.colores?.length ?? 0) > 0 ? (
                                                        <div className="flex items-center gap-1">
                                                            {product.colores.slice(0, 5).map(c => (
                                                                <span
                                                                    key={c.id}
                                                                    className="w-4 h-4 rounded-full border border-slate-200 shadow-sm shrink-0"
                                                                    style={{ backgroundColor: c.nombre.trim() }}
                                                                    title={c.nombre}
                                                                />
                                                            ))}
                                                            {product.colores.length > 5 && (
                                                                <span className="text-[10px] text-slate-400 ml-0.5">+{product.colores.length - 5}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                                    {product.estado === "INACTIVO" ? (
                                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wide">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Inactivo
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Activo
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-4" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center gap-1">
                                                        <Link
                                                            to="/admin/products"
                                                            state={{ editProductId: product.id }}
                                                            title="Editar producto"
                                                            className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Link>
                                                        {product.estado !== "INACTIVO" && (
                                                            <button
                                                                onClick={() => setConfirmInactivate(product)}
                                                                title="Inactivar producto"
                                                                className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-colors"
                                                            >
                                                                <PowerOff className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleRowClick(product)}
                                                            title="Ver stock"
                                                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                                                        >
                                                            <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="border-t border-slate-100 bg-slate-50/50 px-4">
                                    <GenericPagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Modal variantes */}
            <VariantsModal
                product={selectedProduct}
                variants={variants}
                isLoading={isLoadingVariants}
                onClose={handleCloseModal}
                editingId={editingId}
                editingStock={editingStock}
                onStartEditStock={(id, stock) => { setEditingId(id); setEditingStock(String(stock)); }}
                onCancelEditStock={() => setEditingId(null)}
                onStockChange={setEditingStock}
                onSaveStock={handleSaveStock}
                editingTallaId={editingTallaId}
                editingTallaPrecio={editingTallaPrecio}
                onStartEditPrecio={(tallaId, precio) => { setEditingTallaId(tallaId); setEditingTallaPrecio(String(precio)); }}
                onCancelEditPrecio={() => setEditingTallaId(null)}
                onTallaPrecioChange={setEditingTallaPrecio}
                onSavePrecio={handleSavePrecio}
            />

            {/* Modal confirmar inactivar */}
            <ConfirmModal
                isOpen={!!confirmInactivate}
                onOpenChange={open => { if (!open) setConfirmInactivate(null); }}
                title="Inactivar producto"
                confirmLabel="Inactivar"
                variant="danger"
                isLoading={isInactivating}
                onConfirm={handleInactivate}
                description={
                    <>
                        ¿Marcar <strong className="text-slate-800">"{confirmInactivate?.nombre}"</strong> como inactivo?
                        El producto dejará de mostrarse en la tienda.
                    </>
                }
            />
        </div>
    );
};
