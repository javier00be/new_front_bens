import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GenericModal, ConfirmModal } from "@/components/shared/GenericModal";
import {
    Truck, TruckIcon, Pencil, Trash2, Mail, Phone, CreditCard,
    Plus, Building2, Search, X, AlignLeft,
} from "lucide-react";
import { useSuppliers } from "../hooks/useSuppliers";
import type { Supplier, CreateSupplierDto } from "../types/suppliers.type";
import { AddSupplierForm } from "./AddSupplierForm";
import { sileo } from "sileo";

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditSupplierModalProps {
    supplier: Supplier;
    onSave: (dto: Partial<CreateSupplierDto>) => Promise<void>;
    onClose: () => void;
}

const EditSupplierModal = ({ supplier, onSave, onClose }: EditSupplierModalProps) => {
    const [documento,   setDocumento]   = useState(supplier.documento);
    const [nombre,      setNombre]      = useState(supplier.nombre);
    const [descripcion, setDescripcion] = useState(supplier.descripcion ?? "");
    const [correo,      setCorreo]      = useState(supplier.correo);
    const [telefono,    setTelefono]    = useState(supplier.telefono ?? "");
    const [isSaving,    setIsSaving]    = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!documento.trim() || !nombre.trim() || !correo.trim()) {
            sileo.warning({ title: "Campos requeridos", description: "Documento, nombre y correo son obligatorios." });
            return;
        }
        setIsSaving(true);
        await onSave({
            documento:   documento.trim(),
            nombre:      nombre.trim(),
            descripcion: descripcion.trim() || undefined,
            correo:      correo.trim(),
            telefono:    telefono.trim() || undefined,
        });
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
                <Label>RUC / Documento <span className="text-rose-400">*</span></Label>
                <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input value={documento} onChange={e => setDocumento(e.target.value)} className="pl-10" placeholder="20123456789" />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label>Razón Social / Nombre <span className="text-rose-400">*</span></Label>
                <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input value={nombre} onChange={e => setNombre(e.target.value)} className="pl-10" placeholder="Empresa S.A.C." />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label>Descripción <span className="text-slate-400 text-xs">(opcional)</span></Label>
                <div className="relative">
                    <AlignLeft className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input value={descripcion} onChange={e => setDescripcion(e.target.value)} className="pl-10" placeholder="Notas o rubro del proveedor" />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label>Correo electrónico <span className="text-rose-400">*</span></Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input type="email" value={correo} onChange={e => setCorreo(e.target.value)} className="pl-10" placeholder="contacto@empresa.com" />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label>Teléfono <span className="text-slate-400 text-xs">(opcional)</span></Label>
                <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input value={telefono} onChange={e => setTelefono(e.target.value)} className="pl-10" placeholder="999 999 999" />
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

export const SuppliersDashboard = () => {
    const { suppliers, isLoading, addSupplier, editSupplier, removeSupplier } = useSuppliers();
    const [isCreateOpen,   setIsCreateOpen]   = useState(false);
    const [editingItem,    setEditingItem]     = useState<Supplier | null>(null);
    const [confirmDelete,  setConfirmDelete]   = useState<Supplier | null>(null);
    const [isDeleting,     setIsDeleting]      = useState(false);
    const [search,         setSearch]          = useState("");

    const filtered = suppliers.filter(s =>
        s.nombre.toLowerCase().includes(search.toLowerCase()) ||
        s.documento.includes(search) ||
        s.correo.toLowerCase().includes(search.toLowerCase()) ||
        (s.descripcion ?? "").toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = async (dto: CreateSupplierDto) => {
        const created = await addSupplier(dto);
        if (created) {
            sileo.success({ title: "Proveedor creado", description: `"${created.nombre}" fue registrado.` });
            setIsCreateOpen(false);
        } else {
            sileo.error({ title: "Error", description: "No se pudo crear el proveedor. Verifica que el RUC y correo no estén registrados." });
        }
    };

    const handleEdit = async (dto: Partial<CreateSupplierDto>) => {
        if (!editingItem?.id) return;
        const updated = await editSupplier(editingItem.id, dto);
        if (updated) {
            sileo.success({ title: "Proveedor actualizado", description: `"${updated.nombre}" guardado correctamente.` });
            setEditingItem(null);
        } else {
            sileo.error({ title: "Error", description: "No se pudo actualizar el proveedor." });
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete?.id) return;
        setIsDeleting(true);
        const ok = await removeSupplier(confirmDelete.id);
        if (ok) sileo.success({ title: "Proveedor eliminado", description: `"${confirmDelete.nombre}" fue eliminado.` });
        else    sileo.error({ title: "Error", description: "No se pudo eliminar el proveedor." });
        setIsDeleting(false);
        setConfirmDelete(null);
    };

    const withPhone = suppliers.filter(s => s.telefono).length;
    const withDesc  = suppliers.filter(s => s.descripcion).length;

    return (
        <div className="space-y-6 pb-8">

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 px-8 py-7 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.3),transparent_60%)]" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">Módulo ERP</p>
                        <h1 className="text-2xl font-bold text-white">Proveedores</h1>
                        <p className="text-slate-400 text-sm mt-1">Gestiona tus alianzas comerciales y canales de abastecimiento.</p>
                    </div>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-lg backdrop-blur-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Nuevo Proveedor
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total proveedores", value: suppliers.length,  color: "indigo", bg: "bg-indigo-50", icon: <Truck className="w-4 h-4 text-indigo-600" /> },
                    { label: "Con teléfono",       value: withPhone,         color: "teal",   bg: "bg-teal-50",   icon: <Phone className="w-4 h-4 text-teal-600" /> },
                    { label: "Con descripción",    value: withDesc,          color: "violet", bg: "bg-violet-50", icon: <AlignLeft className="w-4 h-4 text-violet-600" /> },
                ].map(({ label, value, color, bg, icon }) => (
                    <Card key={label} className="border-0 shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <div className="flex items-stretch">
                                <div className={`w-1.5 bg-${color}-500 rounded-l-xl shrink-0`} />
                                <div className="flex-1 px-5 py-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                                        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
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
                                placeholder="Buscar por nombre, RUC o correo..."
                                className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 rounded-xl"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 shrink-0">
                            {filtered.length} proveedor{filtered.length !== 1 ? "es" : ""}
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Cargando proveedores...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                                <Truck className="w-8 h-8 text-indigo-200" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500 mb-4">
                                {search ? `Sin resultados para "${search}"` : "Sin proveedores registrados"}
                            </p>
                            {!search && (
                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsCreateOpen(true)}>
                                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Registrar proveedor
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/80">
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">RUC / Doc.</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Razón Social</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Correo</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Teléfono</th>
                                        <th className="px-3 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtered.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <span className="font-mono text-sm font-medium text-slate-700">{s.documento}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900 text-sm">{s.nombre}</span>
                                                    {s.descripcion && (
                                                        <span className="text-xs text-slate-400 max-w-xs truncate">{s.descripcion}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-sm text-slate-600">{s.correo}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-sm text-slate-600">{s.telefono || "—"}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setEditingItem(s)}
                                                        className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(s)}
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
                title="Nuevo Proveedor"
                description="Registra un nuevo socio comercial."
                isOpen={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            >
                <AddSupplierForm
                    onSubmit={handleAdd}
                    onCancel={() => setIsCreateOpen(false)}
                />
            </GenericModal>

            {/* Modal editar */}
            <GenericModal
                title="Editar Proveedor"
                description={`Modificando: ${editingItem?.nombre ?? ""}`}
                isOpen={!!editingItem}
                onOpenChange={open => { if (!open) setEditingItem(null); }}
            >
                {editingItem && (
                    <EditSupplierModal
                        supplier={editingItem}
                        onSave={handleEdit}
                        onClose={() => setEditingItem(null)}
                    />
                )}
            </GenericModal>

            {/* Confirm eliminar */}
            <ConfirmModal
                isOpen={!!confirmDelete}
                onOpenChange={open => { if (!open) setConfirmDelete(null); }}
                title="Eliminar proveedor"
                confirmLabel="Eliminar"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                description={
                    <>¿Eliminar a <strong className="text-slate-800">"{confirmDelete?.nombre}"</strong>? Esta acción no se puede deshacer.</>
                }
            />
        </div>
    );
};

export default SuppliersDashboard;
