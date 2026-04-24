import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { BookOpen, Trash2, Plus, Package, Layers } from "lucide-react";
import { useRecipes } from "../hooks/useRecipes";
import type { Product } from "@/features/erp/products/types/Products.type";
import type { Item } from "@/features/erp/items/types/items.type";
import { getAllProducts } from "@/features/erp/products/services/products.service";
import { getItems } from "@/features/erp/items/services/items.service";
import { sileo } from "sileo";

export const RecipesDashboard = () => {
    const { items: recipeItems, isLoading, fetchRecipe, addItem, removeItem } = useRecipes();
    const [products, setProducts] = useState<Product[]>([]);
    const [articulos, setArticulos] = useState<Item[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null);
    const [newArticuloId, setNewArticuloId] = useState<number | null>(null);
    const [newCantidad, setNewCantidad] = useState("");

    useEffect(() => {
        Promise.all([getAllProducts(), getItems()])
            .then(([p, a]) => { setProducts(p); setArticulos(a); })
            .catch(console.error)
            .finally(() => setLoadingData(false));
    }, []);

    const handleSelectProducto = (id: number) => {
        setSelectedProductoId(id);
        fetchRecipe(id);
    };

    const handleAddItem = async () => {
        if (!selectedProductoId || !newArticuloId || !newCantidad) {
            sileo.warning({ title: "Campos incompletos", description: "Selecciona artículo y cantidad." });
            return;
        }
        const result = await addItem({ productoId: selectedProductoId, articuloId: newArticuloId, cantidad: Number(newCantidad) });
        if (result) {
            sileo.success({ title: "Material agregado", description: "Receta actualizada." });
            setNewArticuloId(null);
            setNewCantidad("");
        } else {
            sileo.error({ title: "Error", description: "No se pudo agregar el material." });
        }
    };

    const handleRemoveItem = async (id: number) => {
        const ok = await removeItem(id);
        if (ok) sileo.success({ title: "Material eliminado", description: "Receta actualizada." });
        else sileo.error({ title: "Error", description: "No se pudo eliminar." });
    };

    const selectedProduct = products.find(p => p.id === selectedProductoId);

    if (loadingData) return (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Cargando datos...</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Recetas de Fabricación"
                description="Define qué materias primas necesita cada producto (BOM)."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel izquierdo: selector de producto */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-500" /> Productos
                        </CardTitle>
                        <CardDescription className="text-xs">Selecciona un producto para ver su receta.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1 max-h-96 overflow-y-auto">
                        {products.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handleSelectProducto(p.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedProductoId === p.id ? "bg-purple-100 text-purple-800 font-semibold" : "hover:bg-slate-50 text-slate-700"}`}
                            >
                                <div className="font-medium">{p.nombre}</div>
                                {p.sku && <div className="text-xs text-slate-400">{p.sku}</div>}
                            </button>
                        ))}
                    </CardContent>
                </Card>

                {/* Panel derecho: receta del producto seleccionado */}
                <Card className="border shadow-sm lg:col-span-2">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-base flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-purple-500" />
                            {selectedProduct ? `Receta: ${selectedProduct.nombre}` : "Selecciona un producto"}
                        </CardTitle>
                        {selectedProduct && <CardDescription className="text-xs">Materiales necesarios por unidad fabricada.</CardDescription>}
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        {!selectedProductoId && (
                            <div className="text-center py-12 text-slate-400">
                                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Selecciona un producto para ver o editar su receta.</p>
                            </div>
                        )}

                        {selectedProductoId && (
                            <>
                                {/* Lista de materiales */}
                                {isLoading ? (
                                    <div className="py-6 flex justify-center">
                                        <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : recipeItems.length === 0 ? (
                                    <div className="py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                                        <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">Sin materiales. Agrega los materiales necesarios abajo.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-[2fr_1fr_1fr_32px] gap-2 px-2 mb-1">
                                            {["Material", "Cantidad", "Unidad", ""].map((h, i) => (
                                                <span key={i} className="text-[10px] font-semibold text-slate-400 uppercase">{h}</span>
                                            ))}
                                        </div>
                                        {recipeItems.map(item => (
                                            <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_32px] gap-2 items-center bg-purple-50/50 rounded-lg px-3 py-2 border border-purple-100">
                                                <span className="text-sm font-medium text-slate-700">{item.articulo?.nombre ?? `Artículo #${item.articuloId}`}</span>
                                                <span className="text-sm font-bold text-purple-700">{item.cantidad}</span>
                                                <span className="text-xs text-slate-500">{item.articulo?.unidad ?? "—"}</span>
                                                <button onClick={() => handleRemoveItem(item.id)}
                                                    className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-rose-50 hover:text-rose-500">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Agregar material */}
                                <div className="border-t pt-4">
                                    <Label className="text-xs text-slate-500 uppercase font-semibold mb-2 block">Agregar material</Label>
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <Select onValueChange={(v) => setNewArticuloId(Number(v))}>
                                                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Artículo / Materia prima" /></SelectTrigger>
                                                <SelectContent>
                                                    {articulos.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.nombre} ({a.unidad})</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24">
                                            <Input type="number" min={0.001} step={0.001} placeholder="Cant." className="h-9 text-sm"
                                                value={newCantidad} onChange={e => setNewCantidad(e.target.value)} />
                                        </div>
                                        <Button onClick={handleAddItem} size="sm" className="h-9 bg-purple-600 hover:bg-purple-700 px-3">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default RecipesDashboard;
