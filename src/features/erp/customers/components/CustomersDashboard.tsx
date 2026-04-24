import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GenericModal, ConfirmModal } from "@/components/shared/GenericModal";
import {
    UserPlus, Pencil, Trash2, Mail, Phone, CreditCard,
    Plus, User, Search, X, Users,
} from "lucide-react";
import { useCustomers } from "../hooks/useCustomers";
import type { Customer, CreateCustomerDto } from "../types/customers.type";
import { AddCustomerForm } from "./AddCustomerForm";
import { api } from "@/api";
import { sileo } from "sileo";

interface TipoDocumento { id: number; nombre: string; abreviatura: string; }

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditCustomerModalProps {
    customer: Customer;
    onSave: (dto: Partial<CreateCustomerDto>) => Promise<void>;
    onClose: () => void;
}

const EditCustomerModal = ({ customer, onSave, onClose }: EditCustomerModalProps) => {
    const [tiposDocumento,  setTiposDocumento]  = useState<TipoDocumento[]>([]);
    const [loadingTipos,    setLoadingTipos]    = useState(true);
    const [tipoDocumentoId, setTipoDocumentoId] = useState(
        customer.tipoDocumentoId ? String(customer.tipoDocumentoId) : ""
    );
    const [documento, setDocumento] = useState(customer.documento);
    const [nombre,    setNombre]    = useState(customer.nombre);
    const [apellido,  setApellido]  = useState(customer.apellido);
    const [correo,    setCorreo]    = useState(customer.correo);
    const [telefono,  setTelefono]  = useState(customer.telefono ?? "");
    const [isSaving,  setIsSaving]  = useState(false);

    useEffect(() => {
        api.get<TipoDocumento[]>("/type-document")
            .then(r => setTiposDocumento(r.data))
            .catch(() => {})
            .finally(() => setLoadingTipos(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!documento.trim() || !nombre.trim() || !apellido.trim() || !correo.trim()) {
            sileo.warning({ title: "Campos requeridos", description: "Documento, nombre, apellido y correo son obligatorios." });
            return;
        }
        setIsSaving(true);
        await onSave({
            tipoDocumentoId: tipoDocumentoId ? Number(tipoDocumentoId) : undefined,
            documento: documento.trim(),
            nombre:    nombre.trim(),
            apellido:  apellido.trim(),
            correo:    correo.trim(),
            telefono:  telefono.trim() || undefined,
        });
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Tipo de documento <span className="text-slate-400 text-xs">(opcional)</span></Label>
                    <Select value={tipoDocumentoId} onValueChange={setTipoDocumentoId} disabled={loadingTipos}>
                        <SelectTrigger>
                            <SelectValue placeholder={loadingTipos ? "Cargando..." : "DNI, RUC..."} />
                        </SelectTrigger>
                        <SelectContent>
                            {tiposDocumento.map(t => (
                                <SelectItem key={t.id} value={String(t.id)}>
                                    {t.abreviatura} — {t.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>Número de documento <span className="text-rose-400">*</span></Label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input value={documento} onChange={e => setDocumento(e.target.value)} className="pl-10" placeholder="12345678" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Nombre <span className="text-rose-400">*</span></Label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input value={nombre} onChange={e => setNombre(e.target.value)} className="pl-10" placeholder="Juan" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label>Apellido <span className="text-rose-400">*</span></Label>
                    <Input value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Pérez" />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label>Correo electrónico <span className="text-rose-400">*</span></Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input type="email" value={correo} onChange={e => setCorreo(e.target.value)} className="pl-10" placeholder="juan@correo.com" />
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

export const CustomersDashboard = () => {
    const { customers, isLoading, addCustomer, editCustomer, removeCustomer } = useCustomers();
    const [isCreateOpen,   setIsCreateOpen]   = useState(false);
    const [editingItem,    setEditingItem]     = useState<Customer | null>(null);
    const [confirmDelete,  setConfirmDelete]   = useState<Customer | null>(null);
    const [isDeleting,     setIsDeleting]      = useState(false);
    const [search,         setSearch]          = useState("");

    const filtered = customers.filter(c =>
        `${c.nombre} ${c.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
        c.documento.toLowerCase().includes(search.toLowerCase()) ||
        c.correo.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = async (dto: CreateCustomerDto) => {
        const created = await addCustomer(dto);
        if (created) {
            sileo.success({ title: "Cliente creado", description: `"${created.nombre} ${created.apellido}" fue registrado.` });
            setIsCreateOpen(false);
        } else {
            sileo.error({ title: "Error", description: "No se pudo crear el cliente. El documento o correo puede estar en uso." });
        }
    };

    const handleEdit = async (dto: Partial<CreateCustomerDto>) => {
        if (!editingItem) return;
        const updated = await editCustomer(editingItem.id, dto);
        if (updated) {
            sileo.success({ title: "Cliente actualizado", description: `"${updated.nombre} ${updated.apellido}" guardado correctamente.` });
            setEditingItem(null);
        } else {
            sileo.error({ title: "Error", description: "No se pudo actualizar el cliente." });
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setIsDeleting(true);
        const ok = await removeCustomer(confirmDelete.id);
        if (ok) sileo.success({ title: "Cliente eliminado", description: `"${confirmDelete.nombre} ${confirmDelete.apellido}" fue eliminado.` });
        else    sileo.error({ title: "Error", description: "No se pudo eliminar el cliente." });
        setIsDeleting(false);
        setConfirmDelete(null);
    };

    const withPhone = customers.filter(c => c.telefono).length;

    return (
        <div className="space-y-6 pb-8">

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-violet-900 via-purple-900 to-indigo-900 px-8 py-7 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.3),transparent_60%)]" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest mb-1">Módulo ERP</p>
                        <h1 className="text-2xl font-bold text-white">Clientes</h1>
                        <p className="text-violet-200/70 text-sm mt-1">Directorio de clientes registrados en el sistema.</p>
                    </div>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-lg backdrop-blur-sm"
                    >
                        <UserPlus className="w-4 h-4 mr-2" /> Nuevo Cliente
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total clientes",  value: customers.length, color: "violet", bg: "bg-violet-50",  icon: <Users className="w-4 h-4 text-violet-600" /> },
                    { label: "Con teléfono",    value: withPhone,         color: "purple", bg: "bg-purple-50",  icon: <Phone className="w-4 h-4 text-purple-600" /> },
                    { label: "Sin teléfono",    value: customers.length - withPhone, color: "slate", bg: "bg-slate-100", icon: <User className="w-4 h-4 text-slate-500" /> },
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
                                placeholder="Buscar por nombre, documento o correo..."
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
                        <p className="text-xs text-slate-400 shrink-0">{filtered.length} cliente{filtered.length !== 1 ? "s" : ""}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                            <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Cargando clientes...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-violet-200" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500 mb-4">
                                {search ? `Sin resultados para "${search}"` : "Sin clientes registrados"}
                            </p>
                            {!search && (
                                <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={() => setIsCreateOpen(true)}>
                                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Agregar cliente
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/80">
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Documento</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nombre completo</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Correo</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Teléfono</th>
                                        <th className="px-3 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtered.map(c => (
                                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="font-mono text-sm font-medium text-slate-700">{c.documento}</span>
                                                        {c.tipoDocumento && (
                                                            <span className="text-[10px] text-slate-400 uppercase">{c.tipoDocumento.abreviatura}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="font-semibold text-slate-800 text-sm">{c.nombre} {c.apellido}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-sm text-slate-600">{c.correo}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-sm text-slate-600">{c.telefono || "—"}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setEditingItem(c)}
                                                        className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(c)}
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
                title="Nuevo Cliente"
                description="Registra un nuevo cliente en el sistema."
                isOpen={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            >
                <AddCustomerForm
                    onSubmit={handleAdd}
                    onCancel={() => setIsCreateOpen(false)}
                />
            </GenericModal>

            {/* Modal editar */}
            <GenericModal
                title="Editar Cliente"
                description={editingItem ? `${editingItem.nombre} ${editingItem.apellido}` : ""}
                isOpen={!!editingItem}
                onOpenChange={open => { if (!open) setEditingItem(null); }}
            >
                {editingItem && (
                    <EditCustomerModal
                        customer={editingItem}
                        onSave={handleEdit}
                        onClose={() => setEditingItem(null)}
                    />
                )}
            </GenericModal>

            {/* Confirm eliminar */}
            <ConfirmModal
                isOpen={!!confirmDelete}
                onOpenChange={open => { if (!open) setConfirmDelete(null); }}
                title="Eliminar cliente"
                confirmLabel="Eliminar"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                description={
                    <>¿Eliminar a <strong className="text-slate-800">"{confirmDelete?.nombre} {confirmDelete?.apellido}"</strong>? Esta acción no se puede deshacer.</>
                }
            />
        </div>
    );
};

export default CustomersDashboard;
