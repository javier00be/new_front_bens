import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GenericModal } from "@/components/shared/GenericModal";
import { HexColorPicker } from "react-colorful";
import { X, Plus, Image as ImageIcon, Upload, Trash2, RefreshCw, ArrowLeft } from "lucide-react";
import { sileo } from "sileo";

import { useCategories } from "../hooks/useCategories";
import { useBrands } from "../hooks/useBrands";
import { useSizes } from "../hooks/useSizes";
import { getProductById, createProduct, updateProduct } from "../services/products.service";
import type { Product, CreateProductDto } from "../types/Products.type";

type ModalType = "categoria" | "marca" | "talla" | null;

export const ProductsDashboard = () => {
    const location = useLocation();
    const navigate  = useNavigate();
    const editProductId: number | undefined = (location.state as { editProductId?: number })?.editProductId;
    const isEdit = !!editProductId;

    // ── Hooks de datos ────────────────────────────────────────────────────────
    const { categories, isLoadingCategories, addCategoryToAPI } = useCategories();
    const { brands, isLoadingBrands, addBrandToAPI }             = useBrands();
    const { sizes, isLoadingSizes, addSizeToAPI }                 = useSizes();

    // ── Estado del formulario ─────────────────────────────────────────────────
    const [isSaving, setIsSaving]         = useState(false);
    const [isLoadingProduct, setIsLoadingProduct] = useState(isEdit);

    const [nombre, setNombre]             = useState("");
    const [precio, setPrecio]             = useState("");
    const [sku, setSku]                   = useState("");
    const [descripcion, setDescripcion]   = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedBrand, setSelectedBrand]       = useState("");
    const [aplicaDescuento, setAplicaDescuento]   = useState(false);
    const [tipoDesc, setTipoDesc]         = useState<"PORCENTAJE" | "VALOR_FIJO">("PORCENTAJE");
    const [valorDesc, setValorDesc]       = useState("");
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [currentColor, setCurrentColor] = useState("#6366f1");
    const [selectedTallas, setSelectedTallas] = useState<string[]>([]);
    const [imagenes, setImagenes]         = useState<(string | null)[]>([null, null, null, null]);

    // ── Quick-add modal ───────────────────────────────────────────────────────
    const [modalType, setModalType]       = useState<ModalType>(null);
    const [newItemName, setNewItemName]   = useState("");
    const [isSavingItem, setIsSavingItem] = useState(false);

    // ── Cargar producto en modo edición ───────────────────────────────────────
    useEffect(() => {
        if (!editProductId) return;
        const load = async () => {
            setIsLoadingProduct(true);
            try {
                const p: Product = await getProductById(editProductId);
                setNombre(p.nombre);
                setPrecio(String(p.precio));
                setSku(p.sku ?? "");
                setDescripcion(p.descripcion ?? "");
                setSelectedCategory(p.categoria ? String(p.categoria.id) : "");
                setSelectedBrand(p.marca ? String(p.marca.id) : "");
                if (p.tipoDescuento !== "SIN_DESCUENTO") {
                    setAplicaDescuento(true);
                    setTipoDesc(p.tipoDescuento === "VALOR_FIJO" ? "VALOR_FIJO" : "PORCENTAJE");
                    setValorDesc(String(p.valorDescuento));
                }
                setSelectedColors(p.colores?.map(c => c.nombre) ?? []);
                setSelectedTallas(p.tallas?.map(t => t.nombre) ?? []);
                const slots: (string | null)[] = [null, null, null, null];
                (p.imagenes ?? []).slice(0, 4).forEach((url, i) => { slots[i] = url; });
                setImagenes(slots);
            } catch {
                sileo.error({ title: "Error", description: "No se pudo cargar el producto." });
                navigate("/admin/inventory");
            } finally {
                setIsLoadingProduct(false);
            }
        };
        load();
    }, [editProductId]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const resetForm = () => {
        setNombre(""); setPrecio(""); setSku(""); setDescripcion("");
        setSelectedCategory(""); setSelectedBrand("");
        setAplicaDescuento(false); setTipoDesc("PORCENTAJE"); setValorDesc("");
        setSelectedColors([]); setSelectedTallas([]);
        setImagenes([null, null, null, null]);
    };

    const openModal = (type: ModalType) => { setNewItemName(""); setModalType(type); };

    const handleAddNew = async () => {
        if (!newItemName.trim()) return;
        setIsSavingItem(true);
        const label = newItemName.trim();
        if (modalType === "categoria") {
            const opt = await addCategoryToAPI(label);
            if (opt) { setSelectedCategory(opt.value); setModalType(null); sileo.success({ title: "Éxito", description: "Categoría guardada." }); }
            else sileo.error({ title: "Error", description: "No se pudo guardar la categoría." });
        } else if (modalType === "marca") {
            const opt = await addBrandToAPI(label);
            if (opt) { setSelectedBrand(opt.value); setModalType(null); sileo.success({ title: "Éxito", description: "Marca guardada." }); }
            else sileo.error({ title: "Error", description: "No se pudo guardar la marca." });
        } else if (modalType === "talla") {
            const opt = await addSizeToAPI(label);
            if (opt) {
                if (!selectedTallas.includes(opt.label)) setSelectedTallas(prev => [...prev, opt.label]);
                setModalType(null);
                sileo.success({ title: "Éxito", description: "Talla guardada." });
            } else sileo.error({ title: "Error", description: "No se pudo guardar la talla." });
        }
        setIsSavingItem(false);
    };

    const handleSelectChange = (value: string, type: "categoria" | "marca" | "talla") => {
        if (value === "nueva") { openModal(type); return; }
        if (type === "categoria") setSelectedCategory(value);
        else if (type === "marca") setSelectedBrand(value);
        else if (type === "talla" && !selectedTallas.includes(value))
            setSelectedTallas(prev => [...prev, value]);
    };

    const toggleTalla = (label: string) =>
        setSelectedTallas(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]);

    const addColor = () => {
        if (!selectedColors.includes(currentColor)) setSelectedColors(prev => [...prev, currentColor]);
    };

    const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagenes(prev => { const next = [...prev]; next[index] = reader.result as string; return next; });
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim() || !precio || !selectedCategory || !selectedBrand) {
            sileo.warning({ title: "Completar datos", description: "Nombre, precio, categoría y marca son obligatorios." });
            return;
        }
        const dto: CreateProductDto = {
            nombre:         nombre.trim(),
            precio:         parseFloat(precio),
            categoriaId:    parseInt(selectedCategory, 10),
            marcaId:        parseInt(selectedBrand, 10),
            estado:         "ACTIVO",
            color:          selectedColors.length > 0 ? selectedColors : undefined,
            tallas:         selectedTallas.length > 0 ? selectedTallas : undefined,
            imagenes:       imagenes.filter(Boolean) as string[],
            sku:            sku.trim() || undefined,
            descripcion:    descripcion.trim() || undefined,
            tipoDescuento:  aplicaDescuento ? tipoDesc : "SIN_DESCUENTO",
            valorDescuento: aplicaDescuento ? parseFloat(valorDesc) || 0 : 0,
        };
        setIsSaving(true);
        try {
            if (isEdit && editProductId) {
                await updateProduct(editProductId, dto);
                sileo.success({ title: "Éxito", description: `"${dto.nombre}" actualizado correctamente.` });
                navigate("/admin/inventory");
            } else {
                await createProduct(dto);
                sileo.success({ title: "Éxito", description: `"${dto.nombre}" creado exitosamente.` });
                resetForm();
            }
        } catch {
            sileo.error({ title: "Error", description: isEdit ? "No se pudo actualizar el producto." : "No se pudo crear el producto." });
        } finally {
            setIsSaving(false);
        }
    };

    // ── Spinner mientras carga producto en edición ────────────────────────────
    if (isLoadingProduct) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">Cargando producto...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* ── Header ── */}
            <div className="px-1 pt-1 pb-4 shrink-0 flex items-center gap-3">
                {isEdit ? (
                    <button
                        onClick={() => navigate("/admin/inventory")}
                        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a Inventario
                    </button>
                ) : (
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Nuevo Producto</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Crea y organiza el catálogo de tu tienda.</p>
                    </div>
                )}
                {isEdit && (
                    <>
                        <span className="text-slate-300">/</span>
                        <h2 className="text-lg font-bold text-slate-800">Editar producto</h2>
                    </>
                )}
            </div>

            {/* ── Quick-add modal ── */}
            <GenericModal
                isOpen={modalType !== null}
                onOpenChange={open => !open && setModalType(null)}
                title={modalType === "categoria" ? "Nueva Categoría" : modalType === "marca" ? "Nueva Marca" : "Nueva Talla"}
                description="Se añadirá al listado de opciones disponibles."
                footer={
                    <>
                        <Button variant="outline" onClick={() => setModalType(null)} disabled={isSavingItem}>Cancelar</Button>
                        <Button onClick={handleAddNew} disabled={!newItemName.trim() || isSavingItem}>
                            {isSavingItem ? "Guardando..." : "Añadir"}
                        </Button>
                    </>
                }
            >
                <div className="space-y-2">
                    <Label htmlFor="new-item">
                        {modalType === "categoria" ? "Nombre de la categoría" : modalType === "marca" ? "Nombre de la marca" : "Nombre o número (ej. XL, 42)"}
                    </Label>
                    <Input
                        id="new-item"
                        placeholder={modalType === "categoria" ? "Ej. Ropa Interior" : modalType === "marca" ? "Ej. Puma" : "Ej. XL"}
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleAddNew()}
                        autoFocus
                    />
                </div>
            </GenericModal>

            {/* ── Formulario ── */}
            <form className="flex-1 flex flex-col min-h-0" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0">

                    {/* Columna izquierda */}
                    <Card className="flex flex-col min-h-0">
                        <CardHeader className="shrink-0">
                            <CardTitle>Información del Producto</CardTitle>
                            <CardDescription>Campos principales del artículo.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4 overflow-y-auto flex-1">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre del Producto</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ej. Terno de Lino Fino"
                                        value={nombre}
                                        onChange={e => setNombre(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="sku"
                                            placeholder="Ej. 10361229"
                                            value={sku}
                                            onChange={e => setSku(e.target.value)}
                                        />
                                        <Button
                                            type="button" variant="outline" size="icon"
                                            onClick={() => setSku(String(Math.floor(10000000 + Math.random() * 90000000)))}
                                            title="Generar SKU"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Categoría</Label>
                                    <Select value={selectedCategory} onValueChange={v => handleSelectChange(v, "categoria")} disabled={isLoadingCategories}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingCategories ? "Cargando..." : "Selecciona una..."} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                            ))}
                                            <SelectItem value="nueva" className="text-primary font-semibold border-t mt-1">+ Añadir nueva...</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Marca</Label>
                                    <Select value={selectedBrand} onValueChange={v => handleSelectChange(v, "marca")} disabled={isLoadingBrands}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingBrands ? "Cargando..." : "Selecciona una..."} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {brands.map(b => (
                                                <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                                            ))}
                                            <SelectItem value="nueva" className="text-primary font-semibold border-t mt-1">+ Añadir nueva...</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Precio Base (S/)</Label>
                                    <Input
                                        id="price"
                                        type="number" min="0" step="0.01"
                                        placeholder="Ej. 99.99"
                                        value={precio}
                                        onChange={e => setPrecio(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Descuento</Label>
                                    <div className="flex items-center gap-3 h-10">
                                        <button
                                            type="button"
                                            onClick={() => setAplicaDescuento(v => !v)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${aplicaDescuento ? "bg-primary" : "bg-slate-200"}`}
                                        >
                                            <span className={`block h-4 w-4 rounded-full bg-white shadow-lg transition-transform ${aplicaDescuento ? "translate-x-6" : "translate-x-1"}`} />
                                        </button>
                                        {!aplicaDescuento && <span className="text-sm text-slate-400">Sin descuento</span>}
                                        {aplicaDescuento && (
                                            <div className="flex items-center gap-2">
                                                <Select value={tipoDesc} onValueChange={v => setTipoDesc(v as "PORCENTAJE" | "VALOR_FIJO")}>
                                                    <SelectTrigger className="h-10 w-36 text-sm"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="PORCENTAJE">Porcentaje (%)</SelectItem>
                                                        <SelectItem value="VALOR_FIJO">Valor fijo (S/)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <div className="relative w-24">
                                                    {tipoDesc === "VALOR_FIJO" && (
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">S/</span>
                                                    )}
                                                    <Input
                                                        type="number" min="0"
                                                        max={tipoDesc === "PORCENTAJE" ? 100 : undefined}
                                                        placeholder="0"
                                                        value={valorDesc}
                                                        onChange={e => setValorDesc(e.target.value)}
                                                        className={`h-10 text-sm ${tipoDesc === "PORCENTAJE" ? "pr-6" : "pl-7"}`}
                                                    />
                                                    {tipoDesc === "PORCENTAJE" && (
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Detalla materiales, estilo, corte y características..."
                                    className="resize-none h-24"
                                    value={descripcion}
                                    onChange={e => setDescripcion(e.target.value)}
                                />
                            </div>

                            {/* Tallas */}
                            <div className="pt-4 border-t space-y-3">
                                <Label className="text-base font-semibold">Tallas Disponibles</Label>
                                {isLoadingSizes ? (
                                    <p className="text-sm text-slate-500">Cargando tallas...</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {sizes.map(s => {
                                            const isSelected = selectedTallas.includes(s.label);
                                            return (
                                                <button
                                                    key={s.value}
                                                    type="button"
                                                    onClick={() => toggleTalla(s.label)}
                                                    className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
                                                        isSelected
                                                            ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105"
                                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                                    }`}
                                                >
                                                    {s.label}
                                                </button>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => openModal("talla")}
                                            className="px-4 py-2 rounded-full border border-dashed border-slate-300 text-sm font-semibold text-slate-500 hover:border-primary hover:text-primary transition-colors flex items-center bg-slate-50"
                                        >
                                            <Plus className="w-4 h-4 mr-1" /> Nueva
                                        </button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Columna derecha */}
                    <div className="flex flex-col gap-6 min-h-0">
                        {/* Colores */}
                        <Card className="shrink-0">
                            <CardHeader className="shrink-0 pb-3">
                                <CardTitle>Paleta de Colores</CardTitle>
                                <CardDescription>Colores disponibles de la prenda.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center gap-2 shrink-0">
                                        <HexColorPicker color={currentColor} onChange={setCurrentColor} style={{ width: "140px", height: "120px" }} />
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded border border-slate-200" style={{ backgroundColor: currentColor }} />
                                            <span className="text-xs font-mono text-slate-600">{currentColor.toUpperCase()}</span>
                                        </div>
                                        <Button type="button" size="sm" className="w-full" onClick={addColor}>
                                            <Plus className="w-3 h-3 mr-1" /> Añadir
                                        </Button>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-500 mb-2">Seleccionados ({selectedColors.length})</p>
                                        {selectedColors.length === 0 ? (
                                            <div className="flex items-center justify-center h-16 rounded-md border-2 border-dashed border-slate-200">
                                                <p className="text-xs text-slate-400">Sin colores</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                                                {selectedColors.map(color => (
                                                    <div key={color} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                                                        <div className="w-3.5 h-3.5 rounded-sm border border-slate-200" style={{ backgroundColor: color }} />
                                                        <span className="text-xs font-mono">{color.toUpperCase()}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedColors(prev => prev.filter(c => c !== color))}
                                                            className="text-slate-400 hover:text-red-500"
                                                        >
                                                            <X className="w-2.5 h-2.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Imágenes */}
                        <Card className="flex-1 min-h-0">
                            <CardHeader className="shrink-0 pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-primary" />
                                    Imágenes del Producto
                                </CardTitle>
                                <CardDescription>Sube hasta 4 imágenes.</CardDescription>
                            </CardHeader>
                            <CardContent className="pb-6">
                                <div className="grid grid-cols-4 gap-3">
                                    {[0, 1, 2, 3].map(index => (
                                        <div key={index} className="relative group aspect-square">
                                            {imagenes[index] ? (
                                                <div className="w-full h-full rounded-xl overflow-hidden border-2 border-slate-100 shadow-sm relative">
                                                    <img
                                                        src={imagenes[index] as string}
                                                        alt={`Producto ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => setImagenes(prev => { const n = [...prev]; n[index] = null; return n; })}
                                                            className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="w-full h-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-primary/50 transition-all cursor-pointer">
                                                    <Upload className="w-4 h-4 text-slate-400" />
                                                    <span className="mt-1 text-[10px] font-medium text-slate-500">Subir</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={e => handleImageChange(index, e)}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end gap-3 pt-4 mt-2 border-t shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isSaving}
                        onClick={isEdit ? () => navigate("/admin/inventory") : resetForm}
                    >
                        {isEdit ? "Cancelar" : "Limpiar"}
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear Producto"}
                    </Button>
                </div>
            </form>
        </div>
    );
};
