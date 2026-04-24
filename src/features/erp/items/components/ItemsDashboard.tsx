import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GenericModal, ConfirmModal } from "@/components/shared/GenericModal";
import {
    Package, PackagePlus, Pencil, Trash2,
    Hash, Tag, Search, X, Layers,
} from "lucide-react";
import { useItems } from "../hooks/useItems";
import type { Item, CreateItemDto } from "../types/items.type";
import { AddItemForm } from "./AddItemForm";
import { sileo } from "sileo";

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditItemModalProps {
    item: Item;
    onSave: (dto: Partial<CreateItemDto>) => Promise<void>;
    onClose: () => void;
}

const EditItemModal = ({ item, onSave, onClose }: EditItemModalProps) => {
    const [nombre, setNombre]         = useState(item.nombre);
    const [descripcion, setDescripcion] = useState(item.descripcion ?? "");
    const [cantidad, setCantidad]     = useState(String(item.cantidad));
    const [precio, setPrecio]         = useState(String(item.precio));
    const [unidad, setUnidad]         = useState(item.unidad);
    const [isSaving, setIsSaving]     = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim() || !unidad.trim() || !cantidad || !precio) {
            sileo.warning({ title: "Campos requeridos", description: "Nombre, cantidad, precio y unidad son obligatorios." });
            return;
        }
        setIsSaving(true);
        await onSave({
            nombre:      nombre.trim(),
            descripcion: descripcion.trim() || undefined,
            cantidad:    parseInt(cantidad, 10),
            precio:      parseFloat(precio),
            unidad:      unidad.trim(),
        });
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
                <Label>Nombre del Insumo</Label>
                <div className="relative">
                    <Package className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input value={nombre} onChange={e => setNombre(e.target.value)} className="pl-10" placeholder="Ej. Tela de algodón" />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label>Descripción <span className="text-slate-400 text-xs">(opcional)</span></Label>
                <Input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción del insumo" />
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                    <Label>Cantidad</Label>
                    <Input type="number" min={1} step={1} value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                    <Label>Precio (S/)</Label>
                    <Input type="number" min={0} step={0.01} value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                    <Label>Unidad</Label>
                    <Input value={unidad} onChange={e => setUnidad(e.target.value)} placeholder="kg, m, unidad..." />
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar cambios"}</Button>
            </div>
        </form>
    );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const ItemsDashboard = () => {
    const { items, isLoading, addItem, editItem, removeItem } = useItems();
    const [isCreateOpen, setIsCreateOpen]   = useState(false);
    const [editingItem, setEditingItem]     = useState<Item | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Item | null>(null);
    const [isDeleting, setIsDeleting]       = useState(false);
    const [search, setSearch]               = useState("");

    const filtered = items.filter(i =>
        i.nombre.toLowerCase().includes(search.toLowerCase()) ||
        i.unidad.toLowerCase().includes(search.toLowerCase()) ||
        (i.descripcion ?? "").toLowerCase().includes(search.toLowerCase())
    );

    const handleEdit = async (dto: Partial<CreateItemDto>) => {
        if (!editingItem) return;
        const updated = await editItem(editingItem.id, dto);
        if (updated) {
            sileo.success({ title: "Insumo actualizado", description: `"${updated.nombre}" guardado correctamente.` });
            setEditingItem(null);
        } else {
            sileo.error({ title: "Error", description: "No se pudo actualizar el insumo." });
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setIsDeleting(true);
        const ok = await removeItem(confirmDelete.id);
        if (ok) sileo.success({ title: "Insumo eliminado", description: `"${confirmDelete.nombre}" fue eliminado.` });
        else    sileo.error({ title: "Error", description: "No se pudo eliminar el insumo." });
        setIsDeleting(false);
        setConfirmDelete(null);
    };

    const totalStock = items.reduce((s, i) => s + i.cantidad, 0);

    return (
        <div className="space-y-6 pb-8">

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-teal-900 via-teal-800 to-emerald-900 px-8 py-7 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.3),transparent_60%)]" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <p className="text-teal-300 text-xs font-semibold uppercase tracking-widest mb-1">Módulo ERP</p>
                        <h1 className="text-2xl font-bold text-white">Insumos</h1>
                        <p className="text-teal-200/70 text-sm mt-1">Administra las materias primas y artículos de tu almacén.</p>
                    </div>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-lg backdrop-blur-sm"
                    >
                        <PackagePlus className="w-4 h-4 mr-2" /> Nuevo Insumo
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total insumos", value: items.length, color: "teal", icon: <Package className="w-4 h-4 text-teal-700" /> },
                    { label: "Stock total", value: totalStock, color: "emerald", icon: <Layers className="w-4 h-4 text-emerald-700" /> },
                    { label: "Valor prom.", value: items.length ? `S/ ${(items.reduce((s,i) => s + i.precio, 0) / items.length).toFixed(2)}` : "—", color: "cyan", icon: <Tag className="w-4 h-4 text-cyan-700" /> },
                ].map(({ label, value, color, icon }) => (
                    <Card key={label} className="border-0 shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <div className="flex items-stretch">
                                <div className={`w-1.5 bg-${color}-500 rounded-l-xl shrink-0`} />
                                <div className="flex-1 px-5 py-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                                        <div className={`w-8 h-8 rounded-lg bg-${color}-50 flex items-center justify-center`}>{icon}</div>
                                    </div>
                                    <p className={`text-2xl font-bold text-${color}-700 tabular-nums`}>{value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabla */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-slate-100 bg-white">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por nombre, unidad..."
                                className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 rounded-xl"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 shrink-0">{filtered.length} insumo{filtered.length !== 1 ? "s" : ""}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Cargando insumos...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
                                <Package className="w-8 h-8 text-teal-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500 mb-4">
                                {search ? `Sin resultados para "${search}"` : "Sin insumos registrados"}
                            </p>
                            {!search && (
                                <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => setIsCreateOpen(true)}>
                                    <PackagePlus className="w-3.5 h-3.5 mr-1.5" /> Agregar insumo
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/80">
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Descripción</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cantidad</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Precio</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unidad</th>
                                        <th className="px-3 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtered.map(item => (
                                        <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <span className="font-medium text-slate-800 text-sm">{item.nombre}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-sm text-slate-500 max-w-xs truncate block">{item.descripcion || "—"}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="font-mono text-sm font-bold text-slate-700">{item.cantidad}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="font-mono text-sm font-bold text-slate-700">S/ {Number(item.precio).toFixed(2)}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded-full">{item.unidad}</span>
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setEditingItem(item)}
                                                        className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(item)}
                                                        className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal crear */}
            <GenericModal
                title="Nuevo Insumo"
                description="Registra una nueva materia prima o artículo en el almacén."
                isOpen={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            >
                <AddItemForm
                    onSuccess={() => { setIsCreateOpen(false); sileo.success({ title: "Insumo creado", description: "El insumo fue registrado." }); }}
                    onCancel={() => setIsCreateOpen(false)}
                />
            </GenericModal>

            {/* Modal editar */}
            <GenericModal
                title="Editar Insumo"
                description={`Modificando: ${editingItem?.nombre ?? ""}`}
                isOpen={!!editingItem}
                onOpenChange={open => { if (!open) setEditingItem(null); }}
            >
                {editingItem && (
                    <EditItemModal
                        item={editingItem}
                        onSave={handleEdit}
                        onClose={() => setEditingItem(null)}
                    />
                )}
            </GenericModal>

            {/* Confirm eliminar */}
            <ConfirmModal
                isOpen={!!confirmDelete}
                onOpenChange={open => { if (!open) setConfirmDelete(null); }}
                title="Eliminar insumo"
                confirmLabel="Eliminar"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                description={<>¿Eliminar el insumo <strong className="text-slate-800">"{confirmDelete?.nombre}"</strong>? Esta acción no se puede deshacer.</>}
            />
        </div>
    );
};

export default ItemsDashboard;
